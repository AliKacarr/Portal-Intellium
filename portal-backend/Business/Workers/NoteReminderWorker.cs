using Business.Helpers;
using Business.Repository.MailRepository;
using Business.Repository.NotificationRepository;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Constants;
using Entities.DTOs;
using Entities.DTOs.NotificationDtos;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Text.RegularExpressions;

namespace Business.Workers
{
    /// <summary>
    /// Not bazlı hatırlatıcıları periyodik tarar ve zamanı gelenlerde kullanıcıya bildirim + mail gönderir.
    /// </summary>
    public sealed class NoteReminderWorker : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<NoteReminderWorker> _logger;
        private readonly IConfiguration _configuration;
        private DateTime _lastHeartbeatUtc = DateTime.MinValue;

        public NoteReminderWorker(
            IServiceScopeFactory scopeFactory,
            ILogger<NoteReminderWorker> logger,
            IConfiguration configuration)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
            _configuration = configuration;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            // Tarama aralığı: appsettings NoteReminder:SweepIntervalSeconds (varsayılan 60 sn).
            // Hatırlatıcılar dakika hassasiyetindeyse 60 sn yeterli; konsol gürültüsü için 10 sn önerilmez.
            var sweepSeconds = Math.Clamp(
                _configuration.GetValue("NoteReminder:SweepIntervalSeconds", 60),
                5,
                3600);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await SweepOnce(stoppingToken).ConfigureAwait(false);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Not hatırlatıcı taraması başarısız.");
                }

                await Task.Delay(TimeSpan.FromSeconds(sweepSeconds), stoppingToken).ConfigureAwait(false);
            }
        }

        private async Task SweepOnce(CancellationToken ct)
        {
            using var scope = _scopeFactory.CreateScope();
            var ctx = scope.ServiceProvider.GetRequiredService<PortalContext>();
            var userDal = scope.ServiceProvider.GetRequiredService<DataAccess.Repository.UserRepository.IUserDal>();
            var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
            var mailService = scope.ServiceProvider.GetRequiredService<IMailService>();
            var smtpProvider = scope.ServiceProvider.GetRequiredService<ISmtpMailParametersProvider>();

            var nowUtc = DateTime.UtcNow;

            // Zamanı gelmiş ve gönderilmemiş hatırlatıcılar (çoklu)
            var due = await ctx.NoteReminders
                .Where(r => r.SentAtUtc == null && r.ReminderAtUtc <= nowUtc)
                .OrderBy(r => r.ReminderAtUtc)
                .Take(50)
                .ToListAsync(ct)
                .ConfigureAwait(false);

            // Heartbeat: varsayılan LogDebug — konsolu doldurmaması için. İzlemek için:
            // "Logging:LogLevel:Business.Workers.NoteReminderWorker": "Debug"
            if (_lastHeartbeatUtc == DateTime.MinValue || (nowUtc - _lastHeartbeatUtc) >= TimeSpan.FromMinutes(1))
            {
                _lastHeartbeatUtc = nowUtc;
                _logger.LogDebug("NoteReminder worker heartbeat. PendingDue={Count}, NowUtc={NowUtc:o}", due.Count, nowUtc);
            }

            if (due.Count == 0) return;

            _logger.LogInformation(
                "NoteReminder sweep: {Count} due reminder(s). NowUtc={NowUtc:o}",
                due.Count,
                nowUtc);

            var mp = smtpProvider.GetUsableParameters();

            foreach (var rem in due)
            {
                try
                {
                    // Çoklu instance / paralel sweep durumunda çift gönderimi engellemek için atomik "claim".
                    // SentAtUtc null ise işaretle; 0 satır etkilendiyse başka worker kapmış demektir.
                    var claimed = await ctx.Database.ExecuteSqlRawAsync(
                        @"UPDATE ""NoteReminders"" SET ""SentAtUtc"" = {0} WHERE ""Id"" = {1} AND ""SentAtUtc"" IS NULL;",
                        new object[] { nowUtc, rem.Id },
                        ct).ConfigureAwait(false);
                    if (claimed == 0)
                        continue;

                    var note = await ctx.Notes.AsNoTracking()
                        .FirstOrDefaultAsync(n => n.Id == rem.NoteId && n.UserId == rem.UserId && !n.IsDeleted, ct)
                        .ConfigureAwait(false);
                    if (note == null) continue;

                    var user = userDal.Get(u => u.Id == rem.UserId);
                    if (user == null) continue;

                    var noteTitle = string.IsNullOrWhiteSpace(note.Title) ? "İsimsiz not" : note.Title.Trim();
                    var notificationTitle = noteTitle; // Bildirimde sadece not adı görünsün
                    var mailSubject = $"Not hatırlatıcısı · {noteTitle}";

                    notificationService.Add(new AddNotificationDto
                    {
                        AssignedUserId = rem.UserId,
                        Title = notificationTitle,
                        Content = "Not hatırlatıcısı zamanı geldi.",
                        Type = NotificationTypeKeys.NoteReminder,
                        ReferenceId = note.Id.ToString()
                    });

                    var to = (user.Email ?? "").Trim();
                    if (!string.IsNullOrWhiteSpace(to) && mp != null)
                    {
                        var contentHtml = BuildSafeContentHtml(note.Content);
                        var reminderLocalTr = ToTurkishLocalDateTime(rem.ReminderAtUtc);
                        var body = BuildReminderEmailHtml(
                            noteTitle: noteTitle,
                            reminderLocalTr: reminderLocalTr,
                            contentHtml: contentHtml);

                        mailService.SendMail(new SendMailDto
                        {
                            MailParameters = mp,
                            ToEmail = to,
                            Subject = mailSubject,
                            Body = body
                        });
                    }
                    else if (string.IsNullOrWhiteSpace(to))
                    {
                        _logger.LogWarning("NoteReminder: kullanıcı email boş; mail atlandı. UserId={UserId}", rem.UserId);
                    }
                    else if (mp == null)
                    {
                        _logger.LogWarning("NoteReminder: SMTP bulunamadı; mail atlandı. UserId={UserId}", rem.UserId);
                    }

                    // Başarılıysa hatırlatıcıyı sil (fazladan tutulmasın).
                    // Claim sırasında SentAtUtc set edildi; buraya geldiysek gönderim OK.
                    await ctx.Database.ExecuteSqlRawAsync(
                        @"DELETE FROM ""NoteReminders"" WHERE ""Id"" = {0};",
                        new object[] { rem.Id },
                        ct).ConfigureAwait(false);

                    _logger.LogInformation(
                        "NoteReminder sent+deleted. ReminderId={ReminderId}, NoteId={NoteId}, UserId={UserId}, AtUtc={AtUtc:o}",
                        rem.Id,
                        rem.NoteId,
                        rem.UserId,
                        rem.ReminderAtUtc);
                }
                catch (Exception ex)
                {
                    // Hata olursa retry edebilsin diye claim'i geri al.
                    try
                    {
                        await ctx.Database.ExecuteSqlRawAsync(
                            @"UPDATE ""NoteReminders"" SET ""SentAtUtc"" = NULL WHERE ""Id"" = {0};",
                            new object[] { rem.Id },
                            ct).ConfigureAwait(false);
                    }
                    catch
                    {
                        // ignore
                    }
                    _logger.LogError(ex, "Not hatırlatıcı gönderimi başarısız (ReminderId={ReminderId}).", rem.Id);
                }
            }
        }

        private static string BuildSafeContentHtml(string? raw)
        {
            var s = raw ?? "";
            if (string.IsNullOrWhiteSpace(s))
                return "<div style=\"opacity:.75\">(Boş not)</div>";

            // Çok temel güvenlik: script bloklarını temizle.
            s = Regex.Replace(s, @"<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>", "", RegexOptions.IgnoreCase);

            // İçerik HTML ise (Notes editor genelde HTML üretiyor), olduğu gibi gönder.
            if (LooksLikeHtml(s))
                return s;

            // Plain text ise encode + satır sonlarını <br> yap.
            var encoded = WebUtility.HtmlEncode(s);
            encoded = encoded.Replace("\r\n", "\n").Replace("\n", "<br/>");
            return $"<div style=\"white-space:normal\">{encoded}</div>";
        }

        private static string ToTurkishLocalDateTime(DateTime utc)
        {
            // Windows'ta "Turkey Standard Time", Linux'ta "Europe/Istanbul" olabiliyor.
            // Bulamazsak UTC'yi gösteririz (en kötü senaryo).
            var tz = TryGetTimeZone("Turkey Standard Time") ?? TryGetTimeZone("Europe/Istanbul");
            var local = tz != null ? TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(utc, DateTimeKind.Utc), tz) : utc;
            return local.ToString("dd.MM.yyyy HH:mm");
        }

        private static TimeZoneInfo? TryGetTimeZone(string id)
        {
            try { return TimeZoneInfo.FindSystemTimeZoneById(id); }
            catch { return null; }
        }

        private static string BuildReminderEmailHtml(string noteTitle, string reminderLocalTr, string contentHtml)
        {
            var safeTitle = WebUtility.HtmlEncode(noteTitle);

            // Inline CSS: çoğu mail client için daha uyumlu.
            return $@"
<!doctype html>
<html>
  <head>
    <meta charset=""utf-8""/>
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0""/>
    <title>Not hatırlatıcısı</title>
  </head>
  <body style=""margin:0;padding:0;background:#f3f4f6;"">
    <div style=""display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;"">
      Not hatırlatıcısı zamanı geldi: {safeTitle}
    </div>

    <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%"" style=""background:#f3f4f6;padding:28px 12px;"">
      <tr>
        <td align=""center"">
          <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""720"" style=""width:720px;max-width:720px;"">
            <tr>
              <td style=""padding:0 0 14px 0;font-family:Arial,Helvetica,sans-serif;"">
                <div style=""font-size:13px;color:#6b7280;"">Portal · Not Hatırlatıcısı</div>
              </td>
            </tr>
            <tr>
              <td style=""background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;"">
                <div style=""background:linear-gradient(135deg,#ef4444 0%,#b91c1c 100%);padding:18px 20px;font-family:Arial,Helvetica,sans-serif;"">
                  <div style=""font-size:12px;letter-spacing:.10em;text-transform:uppercase;color:rgba(255,255,255,.88);font-weight:700;"">
                    Hatırlatıcı
                  </div>
                  <div style=""margin-top:6px;font-size:22px;line-height:1.25;color:#ffffff;font-weight:800;"">
                    {safeTitle}
                  </div>
                  <div style=""margin-top:10px;font-size:13px;color:rgba(255,255,255,.92);"">
                    Zaman: <span style=""font-weight:700;color:#ffffff;"">{WebUtility.HtmlEncode(reminderLocalTr)}</span>
                  </div>
                </div>

                <div style=""padding:18px 20px 20px 20px;font-family:Arial,Helvetica,sans-serif;"">
                  <div style=""font-size:13px;color:#6b7280;margin:0 0 10px 0;"">
                    Not içeriği
                  </div>
                  <div style=""border:1px solid #e5e7eb;border-radius:14px;background:#fafafa;padding:16px;"">
                    {contentHtml}
                  </div>
                  <div style=""margin-top:14px;font-size:12px;color:#9ca3af;"">
                    Bu e-posta otomatik gönderilmiştir.
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td style=""padding:12px 4px 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#9ca3af;text-align:center;"">
                © {DateTime.UtcNow:yyyy} Portal
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>";
        }

        private static bool LooksLikeHtml(string s)
        {
            // Basit heuristik: en az bir tag
            return Regex.IsMatch(s, @"<\s*\/?\s*[a-zA-Z][^>]*>");
        }
    }
}

