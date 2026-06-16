using System.Globalization;
using Business.Repository.MailRepository;
using Business.Repository.NotificationRepository;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;
using Entities.DTOs;
using Entities.DTOs.ExpenseDto;
using Entities.Constants;
using Entities.DTOs.NotificationDtos;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Linq;
using Task = System.Threading.Tasks.Task;

namespace Business.Helpers
{
    public class ExpenseReminderRunner : IExpenseReminderRunner
    {
        private const string StatusPending = "Beklemede";
        private const string StatusRevision = "Revize Bekliyor";
        /// <summary>Kullanıcı revize sonrası tekrar gönderdi; admin onayı bekler.</summary>
        private const string StatusResubmitted = "Revize Edildi";
        private const string CompanySummaryRequestId = "__company__";

        private readonly PortalContext _context;
        private readonly INotificationService _notificationService;
        private readonly IMailService _mailService;
        private readonly ISmtpMailParametersProvider _smtpMailParametersProvider;
        private readonly IUserContext _userContext;
        private readonly IConfiguration _configuration;

        public ExpenseReminderRunner(
            PortalContext context,
            INotificationService notificationService,
            IMailService mailService,
            ISmtpMailParametersProvider smtpMailParametersProvider,
            IUserContext userContext,
            IConfiguration configuration)
        {
            _context = context;
            _notificationService = notificationService;
            _mailService = mailService;
            _smtpMailParametersProvider = smtpMailParametersProvider;
            _userContext = userContext;
            _configuration = configuration;
        }

        public async Task<IDataResult<ExpenseReminderRunResultDto>> RunAsync(RunExpenseRemindersDto dto, CancellationToken cancellationToken = default)
        {
            if (!_userContext.IsAuthenticated || !string.Equals(_userContext.RoleName, RoleNames.Admin, StringComparison.OrdinalIgnoreCase))
                return new ErrorDataResult<ExpenseReminderRunResultDto>("Bu işlem sadece admin kullanıcılar içindir.");

            return await RunCoreAsync(dto, cancellationToken, invokedFromScheduledJob: false);
        }

        public Task<IDataResult<ExpenseReminderRunResultDto>> RunScheduledAsync(RunExpenseRemindersDto dto, CancellationToken cancellationToken = default)
        {
            return RunCoreAsync(dto, cancellationToken, invokedFromScheduledJob: true);
        }

        public async Task NotifyAdminsForExpenseRequestAsync(string requestId, CancellationToken cancellationToken = default, bool forceResendImmediate = false)
        {
            if (string.IsNullOrWhiteSpace(requestId))
                return;

            var expenses = await _context.Expenses
                .Where(e => e.IsActive
                            && e.RequestId == requestId
                            && (e.Status == StatusPending || e.Status == StatusResubmitted))
                .Select(e => new
                {
                    e.Id,
                    e.RequestId,
                    e.UserId,
                    e.CreatedUserId,
                    e.InvoiceDate,
                    e.ExpensePeriod,
                    e.TotalAmount,
                    e.CurrencyCode,
                    e.Status
                })
                .ToListAsync(cancellationToken);

            if (expenses.Count == 0)
                return;

            var expenseOwnerUserId = expenses.First().UserId;
            if (expenseOwnerUserId <= 0)
                return;

            var adminTargets = new List<(long Id, string? Email, string? Name)>();
            var adminClaim = await _context.OperationClaims.FirstOrDefaultAsync(c => c.Name.ToLower() == RoleNames.Admin, cancellationToken);
            if (adminClaim != null)
            {
                adminTargets = await BuildAdminTargetListAsync(adminClaim.Id, mergeCallerIfAdmin: false, noteResult: null, cancellationToken);
                await MergeAdditionalAdminUserIdsAsync(adminTargets, cancellationToken);
                await MergeAdditionalAdminEmailsAsync(adminTargets, cancellationToken);
            }
            else
            {
                // Admin claim yoksa da config email'lerinden kullanıcıları hedefleyebiliriz (test/uyumsuz ortamlarda).
                await MergeAdditionalAdminEmailsAsync(adminTargets, cancellationToken);
            }

            var mailParams = _smtpMailParametersProvider.GetUsableParameters();

            var extraEmailsOnly = ParseAdminEmailsFromConfig(_configuration);
            var todayTr = GetNowTr().Date;

            var companyPendingCount = await _context.Expenses.CountAsync(
                e => e.IsActive
                     && !string.IsNullOrWhiteSpace(e.RequestId)
                     && (e.Status == StatusPending || e.Status == StatusResubmitted),
                cancellationToken);

            // Şirket genelinde iki ayrı kuyruk sayımı (özet bildirimleri ayırmak için)
            var companyPendingOnlyCount = await _context.Expenses.CountAsync(
                e => e.IsActive
                     && !string.IsNullOrWhiteSpace(e.RequestId)
                     && e.Status == StatusPending,
                cancellationToken);

            var companyResubmittedCount = await _context.Expenses.CountAsync(
                e => e.IsActive
                     && !string.IsNullOrWhiteSpace(e.RequestId)
                     && e.Status == StatusResubmitted,
                cancellationToken);
            var period = ResolvePeriod(expenses.Select(x => (x.ExpensePeriod, x.InvoiceDate)));
            if (period == null)
                return;

            var totalByCurrency = expenses
                .GroupBy(x => string.IsNullOrWhiteSpace(x.CurrencyCode) ? "TRY" : x.CurrencyCode!)
                .ToDictionary(g => g.Key, g => Math.Round(g.Sum(x => x.TotalAmount), 2, MidpointRounding.AwayFromZero));
            var periodText = $"{period.Value.year:D4}-{period.Value.month:D2}";
            var requestStatus = ResolveRequestDisplayStatus(expenses.Select(e => e.Status));

            await TrySendReminderAsync(
                requestId,
                "Immediate",
                todayTr,
                requestStatus,
                periodText,
                totalByCurrency,
                adminTargets,
                mailParams,
                dryRun: false,
                companyPendingCount,
                extraEmailsOnly,
                forceResend: forceResendImmediate,
                expenseOwnerUserId,
                cancellationToken);
        }

        public async Task<IDataResult<ExpenseReminderDiagnosticsDto>> GetDiagnosticsAsync(CancellationToken cancellationToken = default)
        {
            if (!_userContext.IsAuthenticated || !string.Equals(_userContext.RoleName, RoleNames.Admin, StringComparison.OrdinalIgnoreCase))
                return new ErrorDataResult<ExpenseReminderDiagnosticsDto>("Bu işlem sadece admin kullanıcılar içindir.");

            var todayTr = GetNowTr().Date;
            var isMonday = todayTr.DayOfWeek == DayOfWeek.Monday;
            var isLastCalendarDay = todayTr.Day == DateTime.DaysInMonth(todayTr.Year, todayTr.Month);
            var forceWeekly = _configuration.GetValue<bool>("ExpenseReminder:ForceWeeklyOnScheduledRun");
            var scheduledWouldProcess = forceWeekly || isMonday || isLastCalendarDay;

            var dto = new ExpenseReminderDiagnosticsDto
            {
                EffectiveDateTr = todayTr.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                IsMonday = isMonday,
                IsLastCalendarDay = isLastCalendarDay,
                ForceWeeklyOnScheduledRun = forceWeekly,
                ScheduledJobWouldProcessToday = scheduledWouldProcess,
                CurrentUserId = _userContext.UserId
            };

            dto.PendingOrRevisionExpenseCount = await _context.Expenses.CountAsync(
                e => e.IsActive
                     && !string.IsNullOrWhiteSpace(e.RequestId)
                     && (e.Status == StatusPending || e.Status == StatusResubmitted),
                cancellationToken);

            var mailParams = _smtpMailParametersProvider.GetUsableParameters();
            dto.MailParametersCustomer1Ok = mailParams != null;

            var adminClaim = await _context.OperationClaims.FirstOrDefaultAsync(c => c.Name.ToLower() == RoleNames.Admin, cancellationToken);
            if (adminClaim == null)
            {
                dto.Hints.Add("OperationClaims içinde admin iddiası bulunamadı.");
                return new SuccessDataResult<ExpenseReminderDiagnosticsDto>(dto, "Teşhis.");
            }

            var adminUserIds = await _context.UserOperationClaims
                .Where(uoc => uoc.OperationClaimId == adminClaim.Id)
                .Select(uoc => uoc.UserId)
                .Distinct()
                .ToListAsync(cancellationToken);

            List<(long Id, string? Email, string? Name)> targets;
            if (adminUserIds.Count == 0)
                targets = new List<(long Id, string? Email, string? Name)>();
            else
            {
                var admins = await _context.Users
                    .Where(u => adminUserIds.Contains(u.Id) && u.IsActive)
                    .Select(u => new { u.Id, u.Email, u.Name })
                    .ToListAsync(cancellationToken);
                targets = admins.Select(a => (a.Id, (string?)a.Email, (string?)a.Name)).ToList();
            }

            var callerId = _userContext.UserId;
            if (targets.All(a => a.Id != callerId))
            {
                var caller = await _context.Users
                    .Where(u => u.Id == callerId && u.IsActive)
                    .Select(u => new { u.Id, u.Email, u.Name })
                    .FirstOrDefaultAsync(cancellationToken);
                if (caller != null)
                    targets.Add((caller.Id, caller.Email, caller.Name));
            }

            await MergeAdditionalAdminUserIdsAsync(targets, cancellationToken);
            await MergeAdditionalAdminEmailsAsync(targets, cancellationToken);

            dto.ResolvedAdminUserIds = targets.Select(t => t.Id).Distinct().OrderBy(x => x).ToList();
            dto.CurrentUserInResolvedAdminList = targets.Any(t => t.Id == callerId);

            if (!scheduledWouldProcess && dto.PendingOrRevisionExpenseCount > 0)
                dto.Hints.Add("Zamanlanmış Quartz job: her Pazartesi ve ayın son günü saat 08:00 (Europe/Istanbul). Bugün tetik günü değil veya ForceWeekly kapalı — planlı hatırlatma üretilmez.");
            if (dto.PendingOrRevisionExpenseCount == 0)
                dto.Hints.Add("Beklemede veya revize sonrası (Revize Edildi) masraf yok veya RequestId boş.");
            if (!dto.MailParametersCustomer1Ok)
                dto.Hints.Add("SMTP yok: MailParameters (CustomerId=1 veya dolu satır) veya appsettings Smtp:Host, Smtp:User, Smtp:Password — e-posta gönderilmez.");
            if (dto.ResolvedAdminUserIds.Count == 0)
                dto.Hints.Add("UserOperationClaims / aktif admin listesi boş. AdditionalAdminUserIds ile kullanıcı ekleyin.");
            if (!dto.CurrentUserInResolvedAdminList)
                dto.Hints.Add("Oturumdaki kullanıcı bildirim hedef listesinde değil; Topbar yalnızca kendi AssignedUserId bildirimlerini gösterir. UserOperationClaims veya ExpenseReminder:AdditionalAdminUserIds ile düzeltin.");

            return new SuccessDataResult<ExpenseReminderDiagnosticsDto>(dto, "Teşhis.");
        }

        public Task<IDataResult<string>> SendTestMailAsync(string toEmail, CancellationToken cancellationToken = default)
        {
            if (!_userContext.IsAuthenticated || !string.Equals(_userContext.RoleName, RoleNames.Admin, StringComparison.OrdinalIgnoreCase))
                return Task.FromResult<IDataResult<string>>(new ErrorDataResult<string>("Bu işlem sadece admin kullanıcılar içindir."));

            if (string.IsNullOrWhiteSpace(toEmail))
                return Task.FromResult<IDataResult<string>>(new ErrorDataResult<string>("Alıcı e-posta (to) boş olamaz."));

            var mailParams = _smtpMailParametersProvider.GetUsableParameters();
            if (mailParams == null)
                return Task.FromResult<IDataResult<string>>(new ErrorDataResult<string>("SMTP bulunamadı: MailParameters tablosunda (tercihen CustomerId=1) veya appsettings Smtp:Host, Smtp:User, Smtp:Password."));

            try
            {
                _mailService.SendMail(new SendMailDto
                {
                    MailParameters = mailParams,
                    ToEmail = toEmail.Trim(),
                    Subject = "Portal — masraf SMTP testi",
                    Body = "<p>Bu e-posta masraf hatırlatmaları ile aynı SMTP ayarlarıyla gönderildi.</p>"
                });
                return Task.FromResult<IDataResult<string>>(new SuccessDataResult<string>(toEmail.Trim(), "Test e-postası gönderildi (SMTP kabul ettiyse birkaç saniye içinde gelir)."));
            }
            catch (Exception ex)
            {
                return Task.FromResult<IDataResult<string>>(new ErrorDataResult<string>(ex.Message));
            }
        }

        private async Task<IDataResult<ExpenseReminderRunResultDto>> RunCoreAsync(RunExpenseRemindersDto dto, CancellationToken cancellationToken, bool invokedFromScheduledJob)
        {
            dto ??= new RunExpenseRemindersDto();
            var result = new ExpenseReminderRunResultDto
            {
                DryRun = dto.DryRun,
                PeriodFilter = string.IsNullOrWhiteSpace(dto.Period) ? null : dto.Period.Trim()
            };

            DateTime todayTr;
            if (!string.IsNullOrWhiteSpace(dto.SimulateNow))
            {
                if (!DateTimeOffset.TryParse(dto.SimulateNow.Trim(), out var ofs))
                    return new ErrorDataResult<ExpenseReminderRunResultDto>("simulateNow geçerli ISO 8601 tarih olmalıdır.");
                todayTr = ofs.Date;
            }
            else
            {
                todayTr = GetNowTr().Date;
            }

            result.EffectiveDateTr = todayTr.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

            (int year, int month)? periodFilterParsed = null;
            if (!string.IsNullOrWhiteSpace(result.PeriodFilter))
            {
                var parts = result.PeriodFilter.Split('-', StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length != 2 || !int.TryParse(parts[0], out var y) || !int.TryParse(parts[1], out var m) || m is < 1 or > 12)
                    return new ErrorDataResult<ExpenseReminderRunResultDto>("period YYYY-MM formatında olmalıdır.");
                periodFilterParsed = (y, m);
            }

            var isMonday = todayTr.DayOfWeek == DayOfWeek.Monday;
            var isLastCalendarDay = todayTr.Day == DateTime.DaysInMonth(todayTr.Year, todayTr.Month);
            var forceWeeklyFromConfig = _configuration.GetValue<bool>("ExpenseReminder:ForceWeeklyOnScheduledRun");

            if (invokedFromScheduledJob && !forceWeeklyFromConfig && !isMonday && !isLastCalendarDay)
            {
                result.Details.Add(
                    "Zamanlanmış job: bugün (TR) Pazartesi veya ayın son günü değil — hatırlatma günü değil (işlem yok).");
                return new SuccessDataResult<ExpenseReminderRunResultDto>(result, "Atlandı.");
            }

            var pendingOrRevisionCount = await _context.Expenses.CountAsync(
                e => e.IsActive
                     && !string.IsNullOrWhiteSpace(e.RequestId)
                     && (e.Status == StatusPending || e.Status == StatusResubmitted),
                cancellationToken);
            if (pendingOrRevisionCount == 0)
            {
                result.Details.Add("Beklemede / revize sonrası (Revize Edildi) masraf yok (COUNT=0).");
                return new SuccessDataResult<ExpenseReminderRunResultDto>(result, "Çalıştırıldı.");
            }

            var companyPendingCount = await _context.Expenses.CountAsync(
                e => e.IsActive
                     && !string.IsNullOrWhiteSpace(e.RequestId)
                     && (e.Status == StatusPending || e.Status == StatusResubmitted),
                cancellationToken);

            // Şirket genelinde iki ayrı kuyruk sayımı (özet bildirimlerini ayırmak için)
            var companyPendingOnlyCount = await _context.Expenses.CountAsync(
                e => e.IsActive
                     && !string.IsNullOrWhiteSpace(e.RequestId)
                     && e.Status == StatusPending,
                cancellationToken);

            var companyResubmittedCount = await _context.Expenses.CountAsync(
                e => e.IsActive
                     && !string.IsNullOrWhiteSpace(e.RequestId)
                     && e.Status == StatusResubmitted,
                cancellationToken);

            var expenses = await _context.Expenses
                .Where(e => e.IsActive
                            && !string.IsNullOrWhiteSpace(e.RequestId)
                            && (e.Status == StatusPending || e.Status == StatusResubmitted))
                .Select(e => new
                {
                    e.Id,
                    e.RequestId,
                    e.UserId,
                    e.CreatedUserId,
                    e.InvoiceDate,
                    e.ExpensePeriod,
                    e.TotalAmount,
                    e.CurrencyCode,
                    e.Status
                })
                .ToListAsync(cancellationToken);

            if (expenses.Count == 0)
            {
                result.Details.Add("Uygun masraf talebi yok (Beklemede / Revize Edildi).");
                return new SuccessDataResult<ExpenseReminderRunResultDto>(result, "Çalıştırıldı.");
            }

            var adminClaim = await _context.OperationClaims.FirstOrDefaultAsync(c => c.Name.ToLower() == RoleNames.Admin, cancellationToken);
            if (adminClaim == null)
                return new ErrorDataResult<ExpenseReminderRunResultDto>("Admin claim bulunamadı.");

            var adminTargets = await BuildAdminTargetListAsync(
                adminClaim.Id,
                mergeCallerIfAdmin: !invokedFromScheduledJob,
                noteResult: result,
                cancellationToken);

            await MergeAdditionalAdminUserIdsAsync(adminTargets, cancellationToken);
            await MergeAdditionalAdminEmailsAsync(adminTargets, cancellationToken);

            if (adminTargets.Count == 0)
                result.Details.Add(
                    "Uyarı: Yapılandırılmış admin kullanıcı yok; yalnızca talep sahibine uygulama içi bildirim (ve mail parametreleri varsa e-posta) gönderilecek.");

            var mailParams = _smtpMailParametersProvider.GetUsableParameters();
            if (mailParams == null)
                result.Details.Add("Uyarı: SMTP yapılandırması yok (MailParameters veya appsettings Smtp:*) — e-posta gönderilmez; bildirimler yine de oluşturulur.");

            var extraEmailsOnly = ParseAdminEmailsFromConfig(_configuration);

            var byRequest = expenses.GroupBy(e => e.RequestId).ToList();
            result.CandidateRequestGroups = byRequest.Count;

            var allowIgnoreSchedule = !invokedFromScheduledJob && dto.IgnoreScheduleRules;
            var forceWeeklyOnSchedule = invokedFromScheduledJob && forceWeeklyFromConfig;
            var forceResend = !invokedFromScheduledJob && dto.ForceResend;

            bool scheduleWeekly;
            bool scheduleMonthEnd;
            if (allowIgnoreSchedule || forceWeeklyOnSchedule)
            {
                scheduleWeekly = true;
                scheduleMonthEnd = false;
                if (forceWeeklyOnSchedule && !allowIgnoreSchedule)
                    result.Details.Add("Not: ExpenseReminder:ForceWeeklyOnScheduledRun=true — zaman kuralı yok sayıldı (yalnızca test/staging için).");
            }
            else if (isMonday && isLastCalendarDay)
            {
                scheduleWeekly = true;
                scheduleMonthEnd = false;
            }
            else
            {
                scheduleWeekly = isMonday;
                scheduleMonthEnd = isLastCalendarDay && !isMonday;
            }

            // Pazartesi (Weekly) Quartz çalışmasında: aynı gün içinde/tekrar çalışsa bile
            // yeni bildirim yığılmasın diye admin kuyruğu bildirimini 1 kez özet olarak gönder.
            if (invokedFromScheduledJob && scheduleWeekly && !dto.DryRun)
            {
                var ignoreIdempotent = _configuration.GetValue<bool>("ExpenseReminder:IgnoreIdempotentOnScheduledRun");
                if (companyPendingOnlyCount > 0)
                {
                    var pendingAttempt = await TrySendCompanySummaryOnceAsync(
                        todayTr.Date,
                        "WeeklyPendingSummary",
                        ignoreIdempotent,
                        companyPendingOnlyCount,
                        adminTargets,
                        mailParams,
                        cancellationToken);

                    if (!string.IsNullOrWhiteSpace(pendingAttempt.Detail))
                        result.Details.Add(pendingAttempt.Detail);
                    result.MailSendFailures += pendingAttempt.MailFailures;
                    result.NotificationAddFailures += pendingAttempt.NotificationFailures;
                    if (pendingAttempt.SentOrWouldSend)
                        result.WeeklyProcessed++;
                    else if (pendingAttempt.SkippedIdempotent)
                        result.SkippedAlreadySent++;
                }

                if (companyResubmittedCount > 0)
                {
                    var revisionAttempt = await TrySendCompanySummaryOnceAsync(
                        todayTr.Date,
                        "WeeklyRevisionSummary",
                        ignoreIdempotent,
                        companyResubmittedCount,
                        adminTargets,
                        mailParams,
                        cancellationToken);

                    if (!string.IsNullOrWhiteSpace(revisionAttempt.Detail))
                        result.Details.Add(revisionAttempt.Detail);
                    result.MailSendFailures += revisionAttempt.MailFailures;
                    result.NotificationAddFailures += revisionAttempt.NotificationFailures;
                    if (revisionAttempt.SentOrWouldSend)
                        result.WeeklyProcessed++;
                    else if (revisionAttempt.SkippedIdempotent)
                        result.SkippedAlreadySent++;
                }

                return new SuccessDataResult<ExpenseReminderRunResultDto>(result, "Hatırlatma çalıştırması tamamlandı.");
            }

            // Ayın son günü Quartz çalışmasında: aynı gün içinde/tekrar çalışsa bile tek özet.
            if (invokedFromScheduledJob && scheduleMonthEnd && !dto.DryRun)
            {
                var ignoreIdempotent = _configuration.GetValue<bool>("ExpenseReminder:IgnoreIdempotentOnScheduledRun");
                if (companyPendingOnlyCount > 0)
                {
                    var pendingAttempt = await TrySendCompanySummaryOnceAsync(
                        todayTr.Date,
                        "MonthEndPendingSummary",
                        ignoreIdempotent,
                        companyPendingOnlyCount,
                        adminTargets,
                        mailParams,
                        cancellationToken);

                    if (!string.IsNullOrWhiteSpace(pendingAttempt.Detail))
                        result.Details.Add(pendingAttempt.Detail);
                    result.MailSendFailures += pendingAttempt.MailFailures;
                    result.NotificationAddFailures += pendingAttempt.NotificationFailures;
                    if (pendingAttempt.SentOrWouldSend)
                        result.MonthEndProcessed++;
                    else if (pendingAttempt.SkippedIdempotent)
                        result.SkippedAlreadySent++;
                }

                if (companyResubmittedCount > 0)
                {
                    var revisionAttempt = await TrySendCompanySummaryOnceAsync(
                        todayTr.Date,
                        "MonthEndRevisionSummary",
                        ignoreIdempotent,
                        companyResubmittedCount,
                        adminTargets,
                        mailParams,
                        cancellationToken);

                    if (!string.IsNullOrWhiteSpace(revisionAttempt.Detail))
                        result.Details.Add(revisionAttempt.Detail);
                    result.MailSendFailures += revisionAttempt.MailFailures;
                    result.NotificationAddFailures += revisionAttempt.NotificationFailures;
                    if (revisionAttempt.SentOrWouldSend)
                        result.MonthEndProcessed++;
                    else if (revisionAttempt.SkippedIdempotent)
                        result.SkippedAlreadySent++;
                }

                return new SuccessDataResult<ExpenseReminderRunResultDto>(result, "Hatırlatma çalıştırması tamamlandı.");
            }

            foreach (var req in byRequest)
            {
                var requestId = req.Key;
                var requestStatus = ResolveRequestDisplayStatus(req.Select(x => x.Status));
                var period = ResolvePeriod(req.Select(x => (x.ExpensePeriod, x.InvoiceDate)));
                if (period == null)
                {
                    result.SkippedUnresolvedPeriod++;
                    continue;
                }

                if (periodFilterParsed.HasValue &&
                    (period.Value.year != periodFilterParsed.Value.year || period.Value.month != periodFilterParsed.Value.month))
                {
                    result.SkippedFiltered++;
                    continue;
                }

                var effectiveWeekly = scheduleWeekly;
                var effectiveMonthEnd = scheduleMonthEnd;

                if (!effectiveWeekly && !effectiveMonthEnd)
                {
                    result.SkippedDueToSchedule++;
                    continue;
                }

                var totalByCurrency = req
                    .GroupBy(x => string.IsNullOrWhiteSpace(x.CurrencyCode) ? "TRY" : x.CurrencyCode!)
                    .ToDictionary(g => g.Key, g => Math.Round(g.Sum(x => x.TotalAmount), 2, MidpointRounding.AwayFromZero));

                var periodText = $"{period.Value.year:D4}-{period.Value.month:D2}";

                if (effectiveWeekly)
                {
                    var msg = await TrySendReminderAsync(
                        requestId,
                        "Weekly",
                        todayTr,
                        requestStatus,
                        periodText,
                        totalByCurrency,
                        adminTargets,
                        mailParams,
                        dto.DryRun,
                        companyPendingCount,
                        extraEmailsOnly,
                        forceResend,
                        req.First().UserId,
                        cancellationToken);
                    ApplyResult(result, msg, "Weekly");
                }

                if (effectiveMonthEnd)
                {
                    var msg = await TrySendReminderAsync(
                        requestId,
                        "MonthEnd",
                        todayTr,
                        requestStatus,
                        periodText,
                        totalByCurrency,
                        adminTargets,
                        mailParams,
                        dto.DryRun,
                        companyPendingCount,
                        extraEmailsOnly,
                        forceResend,
                        req.First().UserId,
                        cancellationToken);
                    ApplyResult(result, msg, "MonthEnd");
                }
            }

            if (result.WeeklyProcessed == 0
                && result.MonthEndProcessed == 0
                && !dto.DryRun
                && result.CandidateRequestGroups > 0)
            {
                if (result.SkippedDueToSchedule > 0)
                    result.Details.Insert(0,
                        $"Zamanlama: {result.SkippedDueToSchedule} talep grubu için bugün (TR) ne Pazartesi ne de takvim ayının son günü değil; tetik yok. Europe/Istanbul tarihi: {result.EffectiveDateTr}. Test: simulateNow veya ignoreScheduleRules=true.");
                else if (allowIgnoreSchedule)
                    result.Details.Insert(0,
                        "ignoreScheduleRules açıkken gönderim yoksa: aynı gün idempotent (zaten gönderilmiş), period filtresi veya bildirim/mail hatası olabilir; aşağıdaki details satırlarına bakın.");
            }

            return new SuccessDataResult<ExpenseReminderRunResultDto>(result, "Hatırlatma çalıştırması tamamlandı.");
        }

        private static void ApplyResult(ExpenseReminderRunResultDto agg, ReminderAttempt msg, string kind)
        {
            if (!string.IsNullOrEmpty(msg.Detail))
                agg.Details.Add(msg.Detail);
            if (msg.AdditionalDetails is { Count: > 0 })
            {
                foreach (var line in msg.AdditionalDetails)
                    agg.Details.Add(line);
            }

            agg.MailSendFailures += msg.MailFailures;
            agg.NotificationAddFailures += msg.NotificationFailures;

            if (msg.SkippedIdempotent)
            {
                agg.SkippedAlreadySent++;
                return;
            }

            if (msg.SentOrWouldSend)
            {
                if (kind == "Weekly") agg.WeeklyProcessed++;
                else if (kind == "MonthEnd") agg.MonthEndProcessed++;
            }
        }

        private sealed class ReminderAttempt
        {
            public bool SkippedIdempotent { get; init; }
            public bool SentOrWouldSend { get; init; }
            public string? Detail { get; init; }
            public List<string>? AdditionalDetails { get; init; }
            public int MailFailures { get; init; }
            public int NotificationFailures { get; init; }
        }

        private async Task<ReminderAttempt> TrySendCompanySummaryOnceAsync(
            DateTime scheduledForTrDate,
            string summaryType,
            bool ignoreIdempotent,
            int companyPendingCount,
            IReadOnlyList<(long Id, string? Email, string? Name)> admins,
            MailParameters? mailParams,
            CancellationToken cancellationToken)
        {
            if (ignoreIdempotent)
            {
                // Kullanıcı isteği: "önceden gönderildi mi" kontrol etme.
                // Aynı gün için log varsa sil, yeniden gönder.
                var oldLogs = await _context.ExpenseRequestReminderLogs
                    .Where(l =>
                        l.RequestId == CompanySummaryRequestId &&
                        l.ReminderType == summaryType &&
                        l.ScheduledForDate.Date == scheduledForTrDate.Date)
                    .ToListAsync(cancellationToken);
                if (oldLogs.Count > 0)
                {
                    _context.ExpenseRequestReminderLogs.RemoveRange(oldLogs);
                    await _context.SaveChangesAsync(cancellationToken);
                }
            }

            var alreadySent = await _context.ExpenseRequestReminderLogs.AnyAsync(l =>
                l.RequestId == CompanySummaryRequestId &&
                l.ReminderType == summaryType &&
                l.ScheduledForDate.Date == scheduledForTrDate.Date &&
                l.Status == "Sent", cancellationToken);

            if (alreadySent && !ignoreIdempotent)
            {
                return new ReminderAttempt
                {
                    SkippedIdempotent = true,
                    Detail = $"{summaryType}: {scheduledForTrDate:yyyy-MM-dd} için zaten gönderilmiş (tekrar gönderilmedi)."
                };
            }

            if (admins.Count == 0)
            {
                return new ReminderAttempt
                {
                    Detail = $"{summaryType}: admin hedef listesi boş; bildirim üretilmedi."
                };
            }

            var title = "Bekleyen masraf / revize talepleri var";
            string content;
            if (summaryType.Contains("Revision", StringComparison.OrdinalIgnoreCase))
            {
                title = "Revize talebi var";
                content = $"Özet (tüm şirket): Revize sonrası tekrar gönderilen {companyPendingCount}. Detay için Masraflarım ekranını kontrol edin.";
            }
            else
            {
                title = "Bekleyen talep var";
                content = $"Özet (tüm şirket): Beklemede {companyPendingCount}. Detay için Masraflarım ekranını kontrol edin.";
            }

            var notificationFailures = 0;
            foreach (var admin in admins)
            {
                var notifRes = _notificationService.Add(new AddNotificationDto
                {
                    AssignedUserId = admin.Id,
                    Title = title,
                    Content = content,
                    Type = NotificationTypeKeys.ExpenseReminderAdminQueue,
                    ReferenceId = null
                });
                if (!notifRes.Success)
                    notificationFailures++;
            }

            // Not: NotificationManager zaten bu Type için mirror e-posta gönderebilir (SMTP varsa).
            _ = mailParams; // method imzası tutarlılığı için; mail gönderimi NotificationManager'da.

            var log = new ExpenseRequestReminderLog
            {
                RequestId = CompanySummaryRequestId,
                ReminderType = summaryType,
                ScheduledForDate = scheduledForTrDate.Date,
                Status = notificationFailures == 0 ? "Sent" : "Failed",
                SentAt = DateTime.UtcNow,
                Error = notificationFailures == 0 ? null : $"Admin bildirim ekleme hatası: {notificationFailures}/{admins.Count}"
            };

            try
            {
                _context.ExpenseRequestReminderLogs.Add(log);
                await _context.SaveChangesAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                return new ReminderAttempt
                {
                    SentOrWouldSend = notificationFailures < admins.Count,
                    Detail = $"{summaryType}: bildirimler işlendi ancak log yazılamadı — {ex.Message}",
                    NotificationFailures = notificationFailures,
                    MailFailures = 0
                };
            }

            return new ReminderAttempt
            {
                SentOrWouldSend = notificationFailures < admins.Count,
                Detail = notificationFailures == 0
                    ? $"{summaryType}: {admins.Count} admin için tek seferlik özet bildirimi gönderildi."
                    : $"{summaryType}: kısmi gönderim (hata {notificationFailures}/{admins.Count}).",
                NotificationFailures = notificationFailures,
                MailFailures = 0
            };
        }

        private async Task<ReminderAttempt> TrySendReminderAsync(
            string requestId,
            string reminderType,
            DateTime scheduledFor,
            string requestStatus,
            string periodText,
            Dictionary<string, decimal> totalByCurrency,
            IReadOnlyList<(long Id, string? Email, string? Name)> admins,
            MailParameters? mailParams,
            bool dryRun,
            int companyPendingCount,
            IReadOnlyList<string> extraEmailsOnly,
            bool forceResend,
            long expenseOwnerUserId,
            CancellationToken cancellationToken)
        {
            if (forceResend && !dryRun)
            {
                var oldLogs = await _context.ExpenseRequestReminderLogs
                    .Where(l =>
                        l.RequestId == requestId &&
                        l.ReminderType == reminderType &&
                        l.ScheduledForDate.Date == scheduledFor.Date)
                    .ToListAsync(cancellationToken);
                if (oldLogs.Count > 0)
                {
                    _context.ExpenseRequestReminderLogs.RemoveRange(oldLogs);
                    await _context.SaveChangesAsync(cancellationToken);
                }
            }

            var alreadySent = await _context.ExpenseRequestReminderLogs.AnyAsync(l =>
                l.RequestId == requestId &&
                l.ReminderType == reminderType &&
                l.ScheduledForDate.Date == scheduledFor.Date &&
                l.Status == "Sent", cancellationToken);

            if (alreadySent)
            {
                return new ReminderAttempt
                {
                    SkippedIdempotent = true,
                    Detail = $"{reminderType} {requestId}: zaten gönderilmiş (idempotent)."
                };
            }

            var display8 = RequestDisplayCode.FormatRequestDisplayCode8(requestId);

            // Title: sadece biri (Revize edildi / Onay bekliyor)
            var title = string.Equals(requestStatus, StatusResubmitted, StringComparison.OrdinalIgnoreCase)
                ? "Revize edildi"
                : "Onay bekliyor";

            // Talep eden ad-soyad
            var requesterName = await _context.Users.AsNoTracking()
                .Where(u => u.Id == expenseOwnerUserId && u.IsActive)
                .Select(u => u.Name)
                .FirstOrDefaultAsync(cancellationToken);
            requesterName = string.IsNullOrWhiteSpace(requesterName) ? "(Bilinmiyor)" : requesterName!.Trim();

            // Content: tek satır
            var notificationContent = $"Talep {display8} · Talep eden: {requesterName}";

            // Mail içeriği artık NotificationManager içinde dto'dan türetiliyor; burada sadece ek e-postalar için basit format.
            var subject = $"{title} · Talep {display8} · {requesterName}";
            var htmlBody = $"{title} · Talep {display8} · {requesterName}";

            var ownerNeedsOwnNotification = expenseOwnerUserId > 0 && !admins.Any(a => a.Id == expenseOwnerUserId);

            if (dryRun)
            {
                var who = admins.Count > 0 ? "admin(ler)" : "";
                if (ownerNeedsOwnNotification)
                    who += (who.Length > 0 ? " + " : "") + "talep sahibi";
                return new ReminderAttempt
                {
                    SentOrWouldSend = true,
                    Detail = $"[DRY RUN] {reminderType} {requestId}: {who} için bildirim" + (mailParams != null ? "+mail" : "") + "."
                };
            }

            if (admins.Count == 0 && expenseOwnerUserId <= 0)
            {
                return new ReminderAttempt
                {
                    Detail = $"{reminderType} {requestId}: hedef yok (admin listesi boş ve talep sahibi yok)."
                };
            }

            var log = new ExpenseRequestReminderLog
            {
                RequestId = requestId,
                ReminderType = reminderType,
                ScheduledForDate = scheduledFor,
                Status = "Sent",
                SentAt = null
            };

            var additionalDetails = new List<string>();
            var notificationFailures = 0;
            var mailFailures = 0;
            var mailErrorLines = new List<string>();

            if (!dryRun && mailParams == null)
                additionalDetails.Add(
                    "SMTP yapılandırması eksik: veritabanında MailParameters (SMTP + User + şifre dolu, tercihen CustomerId=1) veya appsettings içinde Smtp:Host, Smtp:User, Smtp:Password — e-posta gönderilmedi; uygulama içi bildirimler denendi.");

            // Bildirim kaydı NotificationManager'da e-posta yansıtması tetikler (Type=expensereminder / expensereminder_admin).
            var skipExtraMailBecauseAlreadySentTo = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var admin in admins)
            {
                var notifRes = _notificationService.Add(new AddNotificationDto
                {
                    AssignedUserId = admin.Id,
                    Title = title,
                    Content = notificationContent,
                    Type = NotificationTypeKeys.ExpenseReminderAdminQueue,
                    ReferenceId = requestId
                });
                if (!notifRes.Success)
                {
                    notificationFailures++;
                    additionalDetails.Add($"{reminderType} {requestId} admin #{admin.Id}: bildirim eklenemedi — {notifRes.Message}");
                }

                var adminMail = string.IsNullOrWhiteSpace(admin.Email)
                    ? await _context.Users.AsNoTracking()
                        .Where(u => u.Id == admin.Id)
                        .Select(u => u.Email)
                        .FirstOrDefaultAsync(cancellationToken)
                    : admin.Email;

                if (!string.IsNullOrWhiteSpace(adminMail))
                    skipExtraMailBecauseAlreadySentTo.Add(adminMail.Trim());
                else
                    additionalDetails.Add($"{reminderType} {requestId} admin #{admin.Id}: Users.Email boş — bildirim oluştu, e-posta yansıtılamadı.");
            }

            var ownerFailures = 0;
            if (ownerNeedsOwnNotification)
            {
                var ownerTitle = "Masraf talebiniz";
                var ownerContent = $"Talep {display8} · Talep eden: {requesterName}";
                var ownRes = _notificationService.Add(new AddNotificationDto
                {
                    AssignedUserId = expenseOwnerUserId,
                    Title = ownerTitle,
                    Content = ownerContent,
                    Type = NotificationTypeKeys.ExpenseReminder,
                    ReferenceId = requestId
                });
                if (!ownRes.Success)
                {
                    ownerFailures++;
                    additionalDetails.Add($"{reminderType} {requestId} talep sahibi #{expenseOwnerUserId}: bildirim eklenemedi — {ownRes.Message}");
                }
                else
                {
                    var ownerEmail = await _context.Users
                        .Where(u => u.Id == expenseOwnerUserId && u.IsActive)
                        .Select(u => u.Email)
                        .FirstOrDefaultAsync(cancellationToken);
                    if (!string.IsNullOrWhiteSpace(ownerEmail))
                        skipExtraMailBecauseAlreadySentTo.Add(ownerEmail.Trim());
                }
            }

            if (mailParams != null)
            {
                foreach (var extraEmail in extraEmailsOnly)
                {
                    var e = extraEmail.Trim();
                    if (string.IsNullOrWhiteSpace(e) || skipExtraMailBecauseAlreadySentTo.Contains(e))
                        continue;
                    try
                    {
                        _mailService.SendMail(new SendMailDto
                        {
                            MailParameters = mailParams,
                            ToEmail = e,
                            Subject = subject,
                            Body = htmlBody
                        });
                    }
                    catch (Exception ex)
                    {
                        mailFailures++;
                        var line = $"{reminderType} {requestId} ek e-posta {e}: {ex.Message}";
                        mailErrorLines.Add(line);
                        additionalDetails.Add(line);
                    }
                }
            }

            var adminsOk = admins.Count == 0 || notificationFailures < admins.Count;
            var ownerOk = !ownerNeedsOwnNotification || ownerFailures == 0;
            if (!adminsOk || !ownerOk)
            {
                log.SentAt = DateTime.UtcNow;
                log.Status = "Failed";
                log.Error = !adminsOk && !ownerOk
                    ? "Admin ve talep sahibi bildirimleri başarısız."
                    : !adminsOk
                        ? "Tüm admin kullanıcıları için bildirim eklenemedi."
                        : "Talep sahibi için bildirim eklenemedi.";
                try
                {
                    _context.ExpenseRequestReminderLogs.Add(log);
                    await _context.SaveChangesAsync(cancellationToken);
                }
                catch (Exception ex)
                {
                    return new ReminderAttempt
                    {
                        Detail = $"{reminderType} {requestId}: bildirim başarısız ve log kaydı yazılamadı — {ex.Message}",
                        AdditionalDetails = additionalDetails,
                        NotificationFailures = notificationFailures + ownerFailures,
                        MailFailures = mailFailures
                    };
                }

                return new ReminderAttempt
                {
                    Detail = $"{reminderType} {requestId}: bildirim tamamlanamadı (admin hata: {notificationFailures}/{admins.Count}, talep sahibi: {ownerFailures}).",
                    AdditionalDetails = additionalDetails,
                    NotificationFailures = notificationFailures + ownerFailures,
                    MailFailures = mailFailures
                };
            }

            log.SentAt = DateTime.UtcNow;
            log.Status = "Sent";
            log.Error = mailErrorLines.Count > 0 ? string.Join("; ", mailErrorLines) : null;

            try
            {
                _context.ExpenseRequestReminderLogs.Add(log);
                await _context.SaveChangesAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                return new ReminderAttempt
                {
                    Detail = $"{reminderType} {requestId}: gönderim yapıldı ancak idempotent log yazılamadı — {ex.Message}",
                    AdditionalDetails = additionalDetails,
                    NotificationFailures = notificationFailures + ownerFailures,
                    MailFailures = mailFailures
                };
            }

            var detail = $"{reminderType} {requestId}: gönderildi.";
            if (mailFailures > 0)
                detail += $" ({mailFailures} mail hatası)";
            if (notificationFailures > 0 || ownerFailures > 0)
                detail += $" ({notificationFailures} admin / {ownerFailures} talep sahibi bildirim uyarısı)";

            return new ReminderAttempt
            {
                SentOrWouldSend = true,
                Detail = detail,
                AdditionalDetails = additionalDetails.Count > 0 ? additionalDetails : null,
                NotificationFailures = notificationFailures + ownerFailures,
                MailFailures = mailFailures
            };
        }

        private static (int year, int month)? ResolvePeriod(IEnumerable<(string? ExpensePeriod, DateTime InvoiceDate)> rows)
        {
            foreach (var x in rows)
            {
                var p = x.ExpensePeriod;
                if (!string.IsNullOrWhiteSpace(p))
                {
                    var parts = p.Trim().Split('-', StringSplitOptions.RemoveEmptyEntries);
                    if (parts.Length == 2 && int.TryParse(parts[0], out var y) && int.TryParse(parts[1], out var m) && m is >= 1 and <= 12)
                        return (y, m);
                }
            }

            var first = rows.First();
            var d = first.InvoiceDate;
            return (d.Year, d.Month);
        }

        private static string ResolveRequestDisplayStatus(IEnumerable<string> statuses)
        {
            var distinct = statuses.Where(s => !string.IsNullOrEmpty(s)).Distinct().ToList();
            if (distinct.Count == 1)
                return distinct[0];
            if (distinct.Contains(StatusRevision))
                return StatusRevision;
            if (distinct.Contains(StatusResubmitted))
                return StatusResubmitted;
            return StatusPending;
        }

        private async Task<List<(long Id, string? Email, string? Name)>> BuildAdminTargetListAsync(
            long adminOperationClaimId,
            bool mergeCallerIfAdmin,
            ExpenseReminderRunResultDto? noteResult,
            CancellationToken cancellationToken)
        {
            var adminUserIds = await _context.UserOperationClaims
                .Where(uoc => uoc.OperationClaimId == adminOperationClaimId)
                .Select(uoc => uoc.UserId)
                .Distinct()
                .ToListAsync(cancellationToken);

            List<(long Id, string? Email, string? Name)> adminTargets;
            if (adminUserIds.Count == 0)
                adminTargets = new List<(long Id, string? Email, string? Name)>();
            else
            {
                var admins = await _context.Users
                    .Where(u => adminUserIds.Contains(u.Id) && u.IsActive)
                    .Select(u => new { u.Id, u.Email, u.Name })
                    .ToListAsync(cancellationToken);
                adminTargets = admins.Select(a => (a.Id, (string?)a.Email, (string?)a.Name)).ToList();
            }

            if (mergeCallerIfAdmin
                && _userContext.IsAuthenticated
                && string.Equals(_userContext.RoleName, RoleNames.Admin, StringComparison.OrdinalIgnoreCase))
            {
                var callerId = _userContext.UserId;
                if (adminTargets.All(a => a.Id != callerId))
                {
                    var caller = await _context.Users
                        .Where(u => u.Id == callerId && u.IsActive)
                        .Select(u => new { u.Id, u.Email, u.Name })
                        .FirstOrDefaultAsync(cancellationToken);
                    if (caller != null)
                    {
                        adminTargets.Add((caller.Id, caller.Email, caller.Name));
                        noteResult?.Details.Add(
                            $"Not: Oturumdaki admin (UserId={callerId}) UserOperationClaims admin listesinde yoktu; bildirim/mail hedeflerine eklendi.");
                    }
                }
            }

            return adminTargets;
        }

        private async Task MergeAdditionalAdminUserIdsAsync(List<(long Id, string? Email, string? Name)> adminTargets, CancellationToken cancellationToken)
        {
            var raw = _configuration["ExpenseReminder:AdditionalAdminUserIds"];
            if (string.IsNullOrWhiteSpace(raw))
                return;
            foreach (var part in raw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                if (!long.TryParse(part.Trim(), out var uid))
                    continue;
                if (adminTargets.Any(a => a.Id == uid))
                    continue;
                var u = await _context.Users
                    .Where(x => x.Id == uid && x.IsActive)
                    .Select(x => new { x.Id, x.Email, x.Name })
                    .FirstOrDefaultAsync(cancellationToken);
                if (u != null)
                    adminTargets.Add((u.Id, u.Email, u.Name));
            }
        }

        private async Task MergeAdditionalAdminEmailsAsync(List<(long Id, string? Email, string? Name)> adminTargets, CancellationToken cancellationToken)
        {
            var raw = _configuration["ExpenseReminder:AdditionalAdminEmails"];
            if (string.IsNullOrWhiteSpace(raw))
                return;

            var emails = raw
                .Split(new[] { ';', ',' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Where(e => !string.IsNullOrWhiteSpace(e))
                .Select(e => e.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (emails.Count == 0)
                return;

            var users = await _context.Users.AsNoTracking()
                .Where(u => u.IsActive && u.Email != null && emails.Contains(u.Email))
                .Select(u => new { u.Id, u.Email, u.Name })
                .ToListAsync(cancellationToken);

            foreach (var u in users)
            {
                if (adminTargets.Any(a => a.Id == u.Id))
                    continue;
                adminTargets.Add((u.Id, u.Email, u.Name));
            }
        }

        private static IReadOnlyList<string> ParseAdminEmailsFromConfig(IConfiguration configuration)
        {
            var raw = configuration["ExpenseReminder:AdminEmails"];
            if (string.IsNullOrWhiteSpace(raw))
                return Array.Empty<string>();
            return raw
                .Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .Select(s => s.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
        }

        private static DateTime GetNowTr()
        {
            var tz = TimeZoneInfo.FindSystemTimeZoneById("Turkey Standard Time");
            return TimeZoneInfo.ConvertTime(DateTime.UtcNow, tz);
        }
    }
}
