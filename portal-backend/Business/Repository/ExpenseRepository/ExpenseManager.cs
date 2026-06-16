using AutoMapper;
using Business.BusinessAspects;
using Core.Aspects.Autofac.Validation;
using Core.Extensions;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.ExpenseIncompleteDraftRepository;
using DataAccess.Repository.ExpenseDraftSnapshotRepository;
using DataAccess.Repository.ExpenseRepository;
using DataAccess.Repository.ExpenseSettingsRepository;
using DataAccess.Repository.UserCustomerRepository;
using DataAccess.Repository.UserRepository;
using Entities.Concrete;
using Entities.DTOs.ExpenseDto;
using System.Globalization;
using System.Text.Json;
using Business.Repository.ExpenseRepository.Validations;
using Core.Aspects.Autofac.Transaction;
using Core.Constants;
using Business.Helpers;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Threading;
using Business.Repository.MailRepository;
using Business.Repository.NotificationRepository;
using Entities.Constants;
using Entities.DTOs;
using Entities.DTOs.NotificationDtos;

namespace Business.Repository.ExpenseRepository
{
    public class ExpenseManager : IExpenseService
    {
        private const string StatusDraft = "Taslak";
        private readonly IExpenseDal _expenseDal;
        private readonly IExpenseItemDal _expenseItemDal;
        private readonly IExpenseIncompleteDraftDal _expenseIncompleteDraftDal;
        private readonly IExpenseDraftSnapshotDal _expenseDraftSnapshotDal;
        private readonly IUserDal _userDal;
        private readonly IUserCustomerDal _userCustomerDal;
        private readonly IExpenseSettingsDal _expenseSettingsDal;
        private readonly IMapper _mapper;
        private readonly Microsoft.AspNetCore.Http.IHttpContextAccessor _httpContextAccessor;
        private readonly IUserContext _userContext;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<ExpenseManager> _logger;
        private readonly IConfiguration _configuration;
        private readonly IPortalAppUrlProvider _portalAppUrlProvider;

        public ExpenseManager(IExpenseDal expenseDal, IExpenseItemDal expenseItemDal, IExpenseIncompleteDraftDal expenseIncompleteDraftDal, IExpenseDraftSnapshotDal expenseDraftSnapshotDal, IUserDal userDal,
            IUserCustomerDal userCustomerDal, IExpenseSettingsDal expenseSettingsDal, IMapper mapper,
            Microsoft.AspNetCore.Http.IHttpContextAccessor httpContextAccessor, IUserContext userContext,
            IServiceScopeFactory scopeFactory, ILogger<ExpenseManager> logger, IConfiguration configuration, IPortalAppUrlProvider portalAppUrlProvider)
        {
            _expenseDal = expenseDal;
            _expenseItemDal = expenseItemDal;
            _expenseIncompleteDraftDal = expenseIncompleteDraftDal;
            _expenseDraftSnapshotDal = expenseDraftSnapshotDal;
            _userDal = userDal;
            _userCustomerDal = userCustomerDal;
            _expenseSettingsDal = expenseSettingsDal;
            _mapper = mapper;
            _httpContextAccessor = httpContextAccessor;
            _userContext = userContext;
            _scopeFactory = scopeFactory;
            _logger = logger;
            _configuration = configuration;
            _portalAppUrlProvider = portalAppUrlProvider;
        }

        [ValidationAspect(typeof(AddExpenseDtoValidator))]
        public IDataResult<ExpenseDto> Add(AddExpenseDto expenseDto)
        {
            return AddInternal(expenseDto, requestIdOverride: null);
        }

        public IDataResult<UpsertExpenseIncompleteDraftResponseDto> UpsertIncompleteDraft(UpsertExpenseIncompleteDraftRequestDto request)
        {
            if (!_userContext.IsAuthenticated)
                return new ErrorDataResult<UpsertExpenseIncompleteDraftResponseDto>("Yetkilendirme gerekli.");

            request ??= new UpsertExpenseIncompleteDraftRequestDto();

            var userId = _userContext.UserId;
            var now = DateTime.UtcNow;
            var payloadJson = request.Payload.ValueKind == JsonValueKind.Undefined ? "{}" : request.Payload.GetRawText();

            var maxPayloadBytes = _configuration.GetValue("ExpenseIncompleteDraft:MaxPayloadBytes", 25 * 1024 * 1024);
            var payloadBytes = System.Text.Encoding.UTF8.GetByteCount(payloadJson);
            if (payloadBytes > maxPayloadBytes)
            {
                return new ErrorDataResult<UpsertExpenseIncompleteDraftResponseDto>(
                    $"Payload çok büyük ({payloadBytes} byte; üst sınır {maxPayloadBytes}). Görüntüleri küçültün veya ExpenseIncompleteDraft:MaxPayloadBytes ayarını artırın.");
            }

            var periodEndAt = ResolveIncompletePeriodEndAt(request.PeriodEndAt, request.Payload);

            if (string.IsNullOrWhiteSpace(request.DraftId))
            {
                var id = Guid.NewGuid();
                _expenseIncompleteDraftDal.Add(new ExpenseIncompleteDraft
                {
                    Id = id,
                    UserId = userId,
                    Status = "Tamamlanmamış",
                    PayloadJson = payloadJson,
                    PeriodEndAt = periodEndAt,
                    CreatedAt = now,
                    UpdatedAt = now
                });

                return new SuccessDataResult<UpsertExpenseIncompleteDraftResponseDto>(
                    new UpsertExpenseIncompleteDraftResponseDto { DraftId = id.ToString() },
                    "Kaydedildi.");
            }

            if (!Guid.TryParse(request.DraftId.Trim(), out var existingId))
                return new ErrorDataResult<UpsertExpenseIncompleteDraftResponseDto>("Geçersiz draftId.");

            var existing = _expenseIncompleteDraftDal.Get(x => x.Id == existingId && x.UserId == userId);
            if (existing == null)
                return new ErrorDataResult<UpsertExpenseIncompleteDraftResponseDto>("Kayıt bulunamadı.");

            existing.PayloadJson = payloadJson;
            existing.PeriodEndAt = periodEndAt;
            existing.UpdatedAt = now;
            _expenseIncompleteDraftDal.Update(existing);

            return new SuccessDataResult<UpsertExpenseIncompleteDraftResponseDto>(
                new UpsertExpenseIncompleteDraftResponseDto { DraftId = existing.Id.ToString() },
                "Güncellendi.");
        }

        public IResult DeleteIncompleteDraft(string draftId)
        {
            if (!_userContext.IsAuthenticated)
                return new ErrorResult("Yetkilendirme gerekli.");
            if (string.IsNullOrWhiteSpace(draftId))
                return new ErrorResult("Geçersiz draftId.");

            var userId = _userContext.UserId;
            if (!Guid.TryParse(draftId.Trim(), out var id))
                return new ErrorResult("Geçersiz draftId.");

            var existing = _expenseIncompleteDraftDal.Get(x => x.Id == id && x.UserId == userId);
            if (existing == null)
                return new SuccessResult("Zaten silinmiş.");

            _expenseIncompleteDraftDal.Delete(existing);
            return new SuccessResult("Silindi.");
        }

        public IDataResult<List<ExpenseIncompleteDraftDto>> GetMyIncompleteDrafts()
        {
            if (!_userContext.IsAuthenticated)
                return new ErrorDataResult<List<ExpenseIncompleteDraftDto>>("Yetkilendirme gerekli.");

            var userId = _userContext.UserId;
            var now = DateTime.UtcNow;

            var list = _expenseIncompleteDraftDal
                .GetAll(x => x.UserId == userId && (x.PeriodEndAt == null || x.PeriodEndAt >= now))
                .OrderByDescending(x => x.UpdatedAt)
                .ToList();

            var mapped = new List<ExpenseIncompleteDraftDto>();
            foreach (var x in list)
            {
                mapped.Add(new ExpenseIncompleteDraftDto
                {
                    Id = x.Id.ToString(),
                    Status = x.Status,
                    PeriodEndAt = x.PeriodEndAt,
                    UpdatedAt = x.UpdatedAt,
                    CreatedAt = x.CreatedAt,
                    PayloadJson = ParsePayloadJsonForResponse(x.PayloadJson, "incomplete list " + x.Id)
                });
            }

            return new SuccessDataResult<List<ExpenseIncompleteDraftDto>>(mapped, "Liste getirildi.");
        }

        public IDataResult<ExpenseIncompleteDraftDetailDto> GetMyIncompleteDraftById(string draftId)
        {
            if (!_userContext.IsAuthenticated)
                return new ErrorDataResult<ExpenseIncompleteDraftDetailDto>("Yetkilendirme gerekli.");
            if (string.IsNullOrWhiteSpace(draftId))
                return new ErrorDataResult<ExpenseIncompleteDraftDetailDto>("Geçersiz draftId.");

            var userId = _userContext.UserId;
            if (!Guid.TryParse(draftId.Trim(), out var id))
                return new ErrorDataResult<ExpenseIncompleteDraftDetailDto>("Geçersiz draftId.");

            var entity = _expenseIncompleteDraftDal.Get(x => x.Id == id && x.UserId == userId);
            if (entity == null)
                return new ErrorDataResult<ExpenseIncompleteDraftDetailDto>("Kayıt bulunamadı.");

            var dto = new ExpenseIncompleteDraftDetailDto
            {
                Id = entity.Id.ToString(),
                PayloadJson = ParsePayloadJsonForResponse(entity.PayloadJson, "incomplete get " + entity.Id),
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt
            };

            return new SuccessDataResult<ExpenseIncompleteDraftDetailDto>(dto, "Kayıt getirildi.");
        }

        public IDataResult<UpsertExpenseDraftSnapshotResponseDto> UpsertDraftSnapshot(UpsertExpenseDraftSnapshotRequestDto request)
        {
            if (!_userContext.IsAuthenticated)
                return new ErrorDataResult<UpsertExpenseDraftSnapshotResponseDto>("Yetkilendirme gerekli.");

            request ??= new UpsertExpenseDraftSnapshotRequestDto();
            var userId = _userContext.UserId;
            var now = DateTime.UtcNow;
            var payloadJson = request.Payload.ValueKind == JsonValueKind.Undefined ? "{}" : request.Payload.GetRawText();

            if (string.IsNullOrWhiteSpace(request.DraftId))
            {
                var id = Guid.NewGuid();
                _expenseDraftSnapshotDal.Add(new ExpenseDraftSnapshot
                {
                    Id = id,
                    UserId = userId,
                    Status = "Taslak",
                    PayloadJson = payloadJson,
                    CreatedAt = now,
                    UpdatedAt = now
                });
                return new SuccessDataResult<UpsertExpenseDraftSnapshotResponseDto>(
                    new UpsertExpenseDraftSnapshotResponseDto { DraftId = id.ToString() },
                    "Kaydedildi.");
            }

            if (!Guid.TryParse(request.DraftId.Trim(), out var existingId))
                return new ErrorDataResult<UpsertExpenseDraftSnapshotResponseDto>("Geçersiz draftId.");

            var existing = _expenseDraftSnapshotDal.Get(x => x.Id == existingId && x.UserId == userId);
            if (existing == null)
                return new ErrorDataResult<UpsertExpenseDraftSnapshotResponseDto>("Kayıt bulunamadı.");

            existing.PayloadJson = payloadJson;
            existing.UpdatedAt = now;
            _expenseDraftSnapshotDal.Update(existing);

            return new SuccessDataResult<UpsertExpenseDraftSnapshotResponseDto>(
                new UpsertExpenseDraftSnapshotResponseDto { DraftId = existing.Id.ToString() },
                "Güncellendi.");
        }

        public IDataResult<List<ExpenseDraftSnapshotDto>> GetMyDraftSnapshots()
        {
            if (!_userContext.IsAuthenticated)
                return new ErrorDataResult<List<ExpenseDraftSnapshotDto>>("Yetkilendirme gerekli.");

            var userId = _userContext.UserId;
            var list = _expenseDraftSnapshotDal
                .GetAll(x => x.UserId == userId)
                .OrderByDescending(x => x.UpdatedAt)
                .ToList();

            var mapped = list.Select(x => new ExpenseDraftSnapshotDto
            {
                Id = x.Id.ToString(),
                PayloadJson = ParsePayloadJsonForResponse(x.PayloadJson, "draft snapshot list " + x.Id),
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt
            }).ToList();

            return new SuccessDataResult<List<ExpenseDraftSnapshotDto>>(mapped, "Liste getirildi.");
        }

        public IDataResult<ExpenseDraftSnapshotDto> GetMyDraftSnapshotById(string draftId)
        {
            if (!_userContext.IsAuthenticated)
                return new ErrorDataResult<ExpenseDraftSnapshotDto>("Yetkilendirme gerekli.");
            if (string.IsNullOrWhiteSpace(draftId))
                return new ErrorDataResult<ExpenseDraftSnapshotDto>("Geçersiz draftId.");

            var userId = _userContext.UserId;
            if (!Guid.TryParse(draftId.Trim(), out var id))
                return new ErrorDataResult<ExpenseDraftSnapshotDto>("Geçersiz draftId.");

            var entity = _expenseDraftSnapshotDal.Get(x => x.Id == id && x.UserId == userId);
            if (entity == null)
                return new ErrorDataResult<ExpenseDraftSnapshotDto>("Kayıt bulunamadı.");

            return new SuccessDataResult<ExpenseDraftSnapshotDto>(new ExpenseDraftSnapshotDto
            {
                Id = entity.Id.ToString(),
                PayloadJson = ParsePayloadJsonForResponse(entity.PayloadJson, "draft snapshot get " + entity.Id),
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt
            }, "Kayıt getirildi.");
        }

        public IResult DeleteDraftSnapshot(string draftId)
        {
            if (!_userContext.IsAuthenticated)
                return new ErrorResult("Yetkilendirme gerekli.");
            if (string.IsNullOrWhiteSpace(draftId))
                return new ErrorResult("Geçersiz draftId.");

            var userId = _userContext.UserId;
            if (!Guid.TryParse(draftId.Trim(), out var id))
                return new ErrorResult("Geçersiz draftId.");

            var entity = _expenseDraftSnapshotDal.Get(x => x.Id == id && x.UserId == userId);
            if (entity == null)
                return new SuccessResult("Zaten silinmiş.");

            // uuid snapshot silinirken Expenses tablosundaki ilişkili int taslak satırları da pasifleştirilsin (çift kaynak / çift silme)
            SoftDeleteExpenseDraftRowsLinkedToSnapshotPayload(userId, entity.PayloadJson, entity.Id);

            var remaining = _expenseDraftSnapshotDal.Get(x => x.Id == id && x.UserId == userId);
            if (remaining != null)
                _expenseDraftSnapshotDal.Delete(remaining);

            return new SuccessResult("Silindi.");
        }

        /// <summary>
        /// expense_drafts.payload_json içinden Expenses (int id) ve requestId çıkarır; ilgili taslak satırlarını pasifleştirir ve jsonb snapshot satırlarını temizler.
        /// </summary>
        private void SoftDeleteExpenseDraftRowsLinkedToSnapshotPayload(long userId, string? payloadJson, Guid snapshotRowId)
        {
            TryParseDraftPayloadExpenseLinks(payloadJson, out var requestId, out var expenseIds);

            foreach (var eid in expenseIds.Distinct())
            {
                // Başkası adına oluşturulan taslak satırlarında UserId masraf sahibi, CreatedUserId oluşturan olabilir;
                // snapshot silinirken yalnızca UserId == userId ile aranırsa satır kalır (UI'da ikinci silme gerekir).
                var ex = _expenseDal.Get(e =>
                    e.Id == eid && e.IsActive && e.Status == StatusDraft &&
                    (e.UserId == userId || e.CreatedUserId == userId));
                if (ex == null)
                    continue;
                ex.IsActive = false;
                _expenseDal.Update(ex);
            }

            if (!string.IsNullOrWhiteSpace(requestId))
            {
                var rid = requestId.Trim();
                var batch = _expenseDal.GetAll(e =>
                    e.IsActive && e.Status == StatusDraft && e.RequestId == rid &&
                    (e.UserId == userId || e.CreatedUserId == userId)).ToList();
                foreach (var x in batch)
                {
                    x.IsActive = false;
                    _expenseDal.Update(x);
                }
            }

            try
            {
                foreach (var eid in expenseIds.Distinct())
                    _expenseDraftSnapshotDal.DeleteSnapshotsReferencingExpenseDraftId(userId, eid);
                if (!string.IsNullOrWhiteSpace(requestId))
                    _expenseDraftSnapshotDal.DeleteSnapshotsForRequestId(userId, requestId.Trim());
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "uuid taslak için ilişkili snapshot sql temizliği başarısız (SnapshotId={SnapshotId}).", snapshotRowId);
            }
        }

        private static void TryParseDraftPayloadExpenseLinks(string? payloadJson, out string? requestId, out List<int> expenseIds)
        {
            requestId = null;
            var ids = new List<int>();
            expenseIds = ids;
            if (string.IsNullOrWhiteSpace(payloadJson))
                return;

            try
            {
                using var doc = JsonDocument.Parse(payloadJson);
                var root = doc.RootElement;
                if (root.TryGetProperty("requestId", out var rid) && rid.ValueKind == JsonValueKind.String)
                    requestId = rid.GetString();

                static void TryAddIdFromObject(JsonElement el, List<int> target)
                {
                    if (el.ValueKind != JsonValueKind.Object)
                        return;
                    if (el.TryGetProperty("id", out var idEl))
                    {
                        if (idEl.ValueKind == JsonValueKind.Number && idEl.TryGetInt32(out var idv))
                            target.Add(idv);
                        else if (idEl.ValueKind == JsonValueKind.String && int.TryParse(idEl.GetString(), out var idvs))
                            target.Add(idvs);
                    }
                    else if (el.TryGetProperty("Id", out var idEl2))
                    {
                        if (idEl2.ValueKind == JsonValueKind.Number && idEl2.TryGetInt32(out var idv2))
                            target.Add(idv2);
                        else if (idEl2.ValueKind == JsonValueKind.String && int.TryParse(idEl2.GetString(), out var idvs2))
                            target.Add(idvs2);
                    }
                }

                if (root.TryGetProperty("expenses", out var expArr) && expArr.ValueKind == JsonValueKind.Array)
                {
                    foreach (var item in expArr.EnumerateArray())
                        TryAddIdFromObject(item, ids);
                }

                if (root.TryGetProperty("drafts", out var drArr) && drArr.ValueKind == JsonValueKind.Array)
                {
                    foreach (var item in drArr.EnumerateArray())
                        TryAddIdFromObject(item, ids);
                }

                foreach (var key in new[] { "expenseId", "draftExpenseId", "expenseDraftId" })
                {
                    if (root.TryGetProperty(key, out var eid) && eid.ValueKind == JsonValueKind.Number && eid.TryGetInt32(out var v))
                        ids.Add(v);
                }
            }
            catch
            {
                // payload bozuksa sessiz geç; snapshot satırı yine de silinebilir
            }
        }

        /// <summary>
        /// DB'deki payload_json okunurken parse hatasında log yazar; bozuk kayıtta boş obje döner (API şekli korunur).
        /// </summary>
        private JsonElement ParsePayloadJsonForResponse(string? json, string context)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(json))
                    json = "{}";
                using var doc = JsonDocument.Parse(json);
                return doc.RootElement.Clone();
            }
            catch (Exception ex)
            {
                var snippet = json == null ? "" : (json.Length > 200 ? json[..200] + "…" : json);
                _logger.LogWarning(ex, "Masraf taslağı payload JSON okunamadı ({Context}). Snippet: {Snippet}", context, snippet);
                using var doc = JsonDocument.Parse("{}");
                return doc.RootElement.Clone();
            }
        }

        private static DateTime? ResolveIncompletePeriodEndAt(DateTime? provided, JsonElement payload)
        {
            if (provided.HasValue)
                return DateTime.SpecifyKind(provided.Value, DateTimeKind.Utc);

            if (payload.ValueKind == JsonValueKind.Object)
            {
                if (TryGetString(payload, "periodEndAt", out var pe) || TryGetString(payload, "period_end_at", out pe))
                {
                    if (DateTimeOffset.TryParse(pe, out var ofs))
                        return ofs.UtcDateTime;
                }

                if (TryGetString(payload, "expensePeriod", out var p) || TryGetString(payload, "period", out p))
                {
                    var dt = TryParsePeriodToMonthEndUtc(p);
                    if (dt.HasValue) return dt;
                }

                if (payload.TryGetProperty("expenses", out var expenses) && expenses.ValueKind == JsonValueKind.Array)
                {
                    var e0 = expenses.EnumerateArray().FirstOrDefault();
                    if (e0.ValueKind == JsonValueKind.Object)
                    {
                        if (TryGetString(e0, "expensePeriod", out var p2) || TryGetString(e0, "period", out p2))
                        {
                            var dt2 = TryParsePeriodToMonthEndUtc(p2);
                            if (dt2.HasValue) return dt2;
                        }
                    }
                }
            }

            return null;
        }

        private static DateTime? TryParsePeriodToMonthEndUtc(string? period)
        {
            if (string.IsNullOrWhiteSpace(period))
                return null;
            var p = period.Trim();
            if (p.Length == 7 && p[4] == '-' && int.TryParse(p.AsSpan(0, 4), out var y) && int.TryParse(p.AsSpan(5, 2), out var m) && m is >= 1 and <= 12)
            {
                var lastDay = DateTime.DaysInMonth(y, m);
                return new DateTime(y, m, lastDay, 23, 59, 59, DateTimeKind.Utc);
            }
            return null;
        }

        private static bool TryGetString(JsonElement obj, string name, out string value)
        {
            value = string.Empty;
            if (obj.ValueKind != JsonValueKind.Object) return false;
            if (!obj.TryGetProperty(name, out var prop)) return false;
            if (prop.ValueKind == JsonValueKind.String)
            {
                value = prop.GetString() ?? "";
                return !string.IsNullOrWhiteSpace(value);
            }
            return false;
        }

        private static (decimal excludingVat, decimal vat, decimal total, decimal vatRate, List<ExpenseItem> items) ComputeDraftAmountsFromItems(IEnumerable<CreateExpenseItemDto> items)
        {
            var list = items?.Where(x => x != null).ToList() ?? new List<CreateExpenseItemDto>();

            decimal sumExcluding = 0m;
            decimal sumVat = 0m;
            decimal sumTotal = 0m;
            var entities = new List<ExpenseItem>();

            foreach (var it in list)
            {
                var qty = Math.Max(0, it.Quantity);
                var unit = it.UnitPrice;
                var kdv = it.KdvRate;

                var lineExcluding = Math.Round(unit * qty, 2, MidpointRounding.AwayFromZero);
                var lineVat = kdv <= 0 ? 0m : Math.Round(lineExcluding * kdv / 100m, 2, MidpointRounding.AwayFromZero);
                var lineTotal = Math.Round(lineExcluding + lineVat, 2, MidpointRounding.AwayFromZero);

                sumExcluding += lineExcluding;
                sumVat += lineVat;
                sumTotal += lineTotal;

                entities.Add(new ExpenseItem
                {
                    ItemName = (it.ItemName ?? "").Trim(),
                    Quantity = qty,
                    UnitPrice = unit,
                    KdvRate = kdv,
                    TotalAmount = lineTotal,
                    IsKkeg = false
                });
            }

            var excludingVat = Math.Round(sumExcluding, 2, MidpointRounding.AwayFromZero);
            var vat = Math.Round(sumVat, 2, MidpointRounding.AwayFromZero);
            var total = Math.Round(sumTotal, 2, MidpointRounding.AwayFromZero);
            var vatRate = excludingVat > 0 ? Math.Round((vat / excludingVat) * 100m, 2, MidpointRounding.AwayFromZero) : 0m;

            return (excludingVat, vat, total, vatRate, entities);
        }

        [ValidationAspect(typeof(UpsertExpenseDraftDtoValidator))]
        public IDataResult<ExpenseDto> AddDraft(UpsertExpenseDraftDto draftDto)
        {
            try
            {
                if (!_userContext.IsAuthenticated)
                    return new ErrorDataResult<ExpenseDto>("Yetkilendirme gerekli.");

                var currentUserId = _userContext.UserId;
                var requestId = string.IsNullOrWhiteSpace(draftDto?.RequestId)
                    ? Guid.NewGuid().ToString("N")
                    : draftDto!.RequestId!.Trim();

                var user = _userDal.Get(u => u.Id == currentUserId);
                if (user == null)
                    return new ErrorDataResult<ExpenseDto>("Kullanıcı bulunamadı.");

                var customerIdResult = ResolveCustomerIdForExpenseOwner(currentUserId, currentUserId);
                if (!customerIdResult.success)
                    return new ErrorDataResult<ExpenseDto>(customerIdResult.message ?? "Kullanıcı-müşteri ilişkisi bulunamadı.");

                DateTime invoiceDate;
                if (!string.IsNullOrWhiteSpace(draftDto.InvoiceDate))
                {
                    try { invoiceDate = ParseInvoiceDate(draftDto.InvoiceDate!); }
                    catch { invoiceDate = DateTime.Now.Date; }
                }
                else
                {
                    invoiceDate = DateTime.Now.Date;
                }

                var period = string.IsNullOrWhiteSpace(draftDto.ExpensePeriod)
                    ? invoiceDate.ToString("yyyy-MM", CultureInfo.InvariantCulture)
                    : NormalizePeriod(draftDto.ExpensePeriod);

                byte[]? imageBytes = null;
                if (!string.IsNullOrWhiteSpace(draftDto.ImageData))
                {
                    var normalizedBase64Payload = NormalizeImagePayload(draftDto.ImageData);
                    imageBytes = normalizedBase64Payload == null ? null : Convert.FromBase64String(normalizedBase64Payload);
                }

                var expense = new Expense
                {
                    RequestId = requestId,
                    UserId = currentUserId,
                    CreatedUserId = currentUserId,
                    ExpensePeriod = period,
                    CustomerId = customerIdResult.customerId,
                    InvoiceNumber = (draftDto.InvoiceNumber ?? "").Trim(),
                    InvoiceDate = invoiceDate,
                    ProjectName = (draftDto.ProjectName ?? "").Trim(),
                    InvoiceTitle = (draftDto.InvoiceTitle ?? "").Trim(),
                    ExtraCategorie = string.IsNullOrWhiteSpace(draftDto.ExtraCategorie) ? null : draftDto.ExtraCategorie.Trim(),
                    ExpenseType = string.IsNullOrWhiteSpace(draftDto.ExpenseType) ? null : NormalizeExpenseType(draftDto.ExpenseType),
                    CurrencyCode = ExpenseCurrencyCodes.Normalize(draftDto.CurrencyCode),
                    Description = (draftDto.Description ?? "").Trim(),
                    PersonCount = draftDto.PersonCount ?? 0,
                    AcceptedDailyAmount = draftDto.AcceptedDailyAmount ?? 0m,
                    UncoveredAmount = draftDto.UncoveredAmount ?? 0m,
                    MealPersonNames = draftDto.MealPersonNames?.Trim(),
                    MealDescription = draftDto.MealDescription?.Trim(),
                    ExcludingVatAmount = draftDto.ExcludingVatAmount ?? 0m,
                    VatRate = draftDto.VatRate ?? 0m,
                    Vat = draftDto.Vat ?? 0m,
                    TotalAmount = draftDto.TotalAmount ?? 0m,
                    OriginalTotalAmount = draftDto.TotalAmount ?? 0m,
                    HasKkeg = false,
                    Status = StatusDraft,
                    RejectReason = null,
                    RevisionReason = null,
                    ImageData = imageBytes,
                    ImagePath = string.IsNullOrWhiteSpace(draftDto.ImagePath) ? null : draftDto.ImagePath.Trim(),
                    IsActive = true,
                    IsPinned = draftDto.IsPinned ?? false,
                };

                var items = draftDto.Items ?? new List<CreateExpenseItemDto>();
                if (items.Count > 0)
                {
                    var computed = ComputeDraftAmountsFromItems(items);
                    // Frontend bazen TotalAmount alanını kalemler değişse bile güncellemiyor.
                    // Taslakta tutarlılık için kalemlerden hesaplanan toplamı esas al.
                    if (!draftDto.TotalAmount.HasValue
                        || Math.Abs(draftDto.TotalAmount.Value - computed.total) > 0.01m)
                    {
                        expense.ExcludingVatAmount = computed.excludingVat;
                        expense.Vat = computed.vat;
                        expense.TotalAmount = computed.total;
                        expense.OriginalTotalAmount = computed.total;
                        expense.VatRate = computed.vatRate;
                    }

                    _expenseDal.AddWithItems(expense, computed.items);
                }
                else
                {
                    _expenseDal.Add(expense);
                }

                return new SuccessDataResult<ExpenseDto>(ToDto(expense), "Taslak kaydedildi.");
            }
            catch (FormatException)
            {
                return new ErrorDataResult<ExpenseDto>("Geçersiz Base64 imageData");
            }
            catch (Exception ex)
            {
                return new ErrorDataResult<ExpenseDto>($"Taslak kaydedilemedi: {ex.Message}");
            }
        }

        [ValidationAspect(typeof(UpsertExpenseDraftDtoValidator))]
        [TransactionScopeAspect]
        public IDataResult<List<ExpenseDto>> BulkInsertDraft(BulkInsertExpenseDraftRequestDto request, IReadOnlyList<string>? imagePathsByIndex = null)
        {
            if (!_userContext.IsAuthenticated)
                return new ErrorDataResult<List<ExpenseDto>>("Yetkilendirme gerekli.");

            if (request?.Expenses == null || request.Expenses.Count == 0)
                return new ErrorDataResult<List<ExpenseDto>>("En az bir taslak gönderilmelidir.");

            var currentUserId = _userContext.UserId;
            var requestId = Guid.NewGuid().ToString("N");

            var customerIdResult = ResolveCustomerIdForExpenseOwner(currentUserId, currentUserId);
            if (!customerIdResult.success)
                return new ErrorDataResult<List<ExpenseDto>>(customerIdResult.message ?? "Kullanıcı-müşteri ilişkisi bulunamadı.");

            var entities = new List<Expense>();
            for (var i = 0; i < request.Expenses.Count; i++)
            {
                var item = request.Expenses[i];
                if (item == null)
                    continue;

                DateTime invoiceDate;
                if (!string.IsNullOrWhiteSpace(item.InvoiceDate))
                {
                    try { invoiceDate = ParseInvoiceDate(item.InvoiceDate!); }
                    catch { invoiceDate = DateTime.Now.Date; }
                }
                else invoiceDate = DateTime.Now.Date;

                var period = string.IsNullOrWhiteSpace(item.ExpensePeriod)
                    ? invoiceDate.ToString("yyyy-MM", CultureInfo.InvariantCulture)
                    : NormalizePeriod(item.ExpensePeriod);

                byte[]? imageBytes = null;
                if (!string.IsNullOrWhiteSpace(item.ImageData))
                {
                    var normalized = NormalizeImagePayload(item.ImageData);
                    imageBytes = normalized == null ? null : Convert.FromBase64String(normalized);
                }

                string? imagePath = null;
                if (imagePathsByIndex != null && i >= 0 && i < imagePathsByIndex.Count)
                    imagePath = imagePathsByIndex[i];

                entities.Add(new Expense
                {
                    RequestId = string.IsNullOrWhiteSpace(item.RequestId) ? requestId : item.RequestId!.Trim(),
                    UserId = currentUserId,
                    CreatedUserId = currentUserId,
                    ExpensePeriod = period,
                    CustomerId = customerIdResult.customerId,
                    InvoiceNumber = (item.InvoiceNumber ?? "").Trim(),
                    InvoiceDate = invoiceDate,
                    ProjectName = (item.ProjectName ?? "").Trim(),
                    InvoiceTitle = (item.InvoiceTitle ?? "").Trim(),
                    ExtraCategorie = string.IsNullOrWhiteSpace(item.ExtraCategorie) ? null : item.ExtraCategorie.Trim(),
                    ExpenseType = string.IsNullOrWhiteSpace(item.ExpenseType) ? null : NormalizeExpenseType(item.ExpenseType),
                    CurrencyCode = ExpenseCurrencyCodes.Normalize(item.CurrencyCode),
                    Description = (item.Description ?? "").Trim(),
                    PersonCount = item.PersonCount ?? 0,
                    AcceptedDailyAmount = item.AcceptedDailyAmount ?? 0m,
                    UncoveredAmount = item.UncoveredAmount ?? 0m,
                    MealPersonNames = item.MealPersonNames?.Trim(),
                    MealDescription = item.MealDescription?.Trim(),
                    ExcludingVatAmount = item.ExcludingVatAmount ?? 0m,
                    VatRate = item.VatRate ?? 0m,
                    Vat = item.Vat ?? 0m,
                    TotalAmount = item.TotalAmount ?? 0m,
                    OriginalTotalAmount = item.TotalAmount ?? 0m,
                    HasKkeg = false,
                    Status = StatusDraft,
                    ImageData = imageBytes,
                    ImagePath = imagePath,
                    IsActive = true,
                    IsPinned = item.IsPinned ?? false,
                });
            }

            _expenseDal.AddRange(entities);
            return new SuccessDataResult<List<ExpenseDto>>(entities.Select(e => ToDto(e)).ToList(), $"{entities.Count} taslak kaydedildi.");
        }

        public IDataResult<List<ExpenseDto>> GetMyDrafts()
        {
            if (!_userContext.IsAuthenticated)
                return new ErrorDataResult<List<ExpenseDto>>("Yetkilendirme gerekli.");

            var uid = _userContext.UserId;
            var drafts = _expenseDal
                .GetAll(e => e.IsActive && e.UserId == uid && e.Status == StatusDraft)
                .OrderByDescending(e => e.InvoiceDate)
                .ToList();

            return new SuccessDataResult<List<ExpenseDto>>(MapExpensesToDtos(drafts), "Taslaklar getirildi.");
        }

        [ValidationAspect(typeof(UpsertExpenseDraftDtoValidator))]
        [TransactionScopeAspect]
        public IDataResult<ExpenseDto> UpdateDraft(int draftId, UpsertExpenseDraftDto draftDto)
        {
            if (!_userContext.IsAuthenticated)
                return new ErrorDataResult<ExpenseDto>("Yetkilendirme gerekli.");

            var uid = _userContext.UserId;
            var draft = _expenseDal.Get(e => e.Id == draftId && e.IsActive && e.UserId == uid && e.Status == StatusDraft);
            if (draft == null)
                return new ErrorDataResult<ExpenseDto>("Taslak bulunamadı.");

            if (draftDto.RequestId != null)
                draft.RequestId = string.IsNullOrWhiteSpace(draftDto.RequestId) ? draft.RequestId : draftDto.RequestId.Trim();
            if (draftDto.InvoiceNumber != null)
                draft.InvoiceNumber = (draftDto.InvoiceNumber ?? "").Trim();
            if (draftDto.ProjectName != null)
                draft.ProjectName = (draftDto.ProjectName ?? "").Trim();
            if (draftDto.InvoiceTitle != null)
                draft.InvoiceTitle = (draftDto.InvoiceTitle ?? "").Trim();
            if (draftDto.Description != null)
                draft.Description = (draftDto.Description ?? "").Trim();
            if (draftDto.ExtraCategorie != null)
                draft.ExtraCategorie = string.IsNullOrWhiteSpace(draftDto.ExtraCategorie) ? null : draftDto.ExtraCategorie.Trim();
            if (draftDto.ExpenseType != null)
                draft.ExpenseType = string.IsNullOrWhiteSpace(draftDto.ExpenseType) ? null : NormalizeExpenseType(draftDto.ExpenseType);
            if (draftDto.CurrencyCode != null)
                draft.CurrencyCode = ExpenseCurrencyCodes.Normalize(draftDto.CurrencyCode);

            if (draftDto.PersonCount.HasValue)
                draft.PersonCount = draftDto.PersonCount.Value;
            if (draftDto.AcceptedDailyAmount.HasValue)
                draft.AcceptedDailyAmount = draftDto.AcceptedDailyAmount.Value;
            if (draftDto.UncoveredAmount.HasValue)
                draft.UncoveredAmount = draftDto.UncoveredAmount.Value;
            if (draftDto.MealPersonNames != null)
                draft.MealPersonNames = string.IsNullOrWhiteSpace(draftDto.MealPersonNames) ? null : draftDto.MealPersonNames.Trim();
            if (draftDto.MealDescription != null)
                draft.MealDescription = string.IsNullOrWhiteSpace(draftDto.MealDescription) ? null : draftDto.MealDescription.Trim();

            if (draftDto.ExcludingVatAmount.HasValue)
                draft.ExcludingVatAmount = draftDto.ExcludingVatAmount.Value;
            if (draftDto.VatRate.HasValue)
                draft.VatRate = draftDto.VatRate.Value;
            if (draftDto.Vat.HasValue)
                draft.Vat = draftDto.Vat.Value;
            if (draftDto.TotalAmount.HasValue)
            {
                draft.TotalAmount = draftDto.TotalAmount.Value;
                draft.OriginalTotalAmount = draftDto.TotalAmount.Value;
            }

            if (draftDto.IsPinned.HasValue)
                draft.IsPinned = draftDto.IsPinned.Value;

            if (draftDto.ExpensePeriod != null)
                draft.ExpensePeriod = string.IsNullOrWhiteSpace(draftDto.ExpensePeriod) ? draft.ExpensePeriod : NormalizePeriod(draftDto.ExpensePeriod);

            if (draftDto.InvoiceDate != null && !string.IsNullOrWhiteSpace(draftDto.InvoiceDate))
            {
                try { draft.InvoiceDate = ParseInvoiceDate(draftDto.InvoiceDate); } catch { }
            }

            if (draftDto.ImageData != null)
            {
                if (string.IsNullOrWhiteSpace(draftDto.ImageData))
                {
                    draft.ImageData = null;
                }
                else
                {
                    var normalized = NormalizeImagePayload(draftDto.ImageData);
                    draft.ImageData = normalized == null ? null : Convert.FromBase64String(normalized);
                }
            }
            if (draftDto.ImagePath != null)
                draft.ImagePath = string.IsNullOrWhiteSpace(draftDto.ImagePath) ? null : draftDto.ImagePath.Trim();

            if (draftDto.Items != null)
            {
                var oldItems = _expenseItemDal.GetAll(i => i.ExpenseId == draft.Id);
                foreach (var oi in oldItems)
                    _expenseItemDal.Delete(oi);

                var computed = ComputeDraftAmountsFromItems(draftDto.Items);

                foreach (var itemEntity in computed.items)
                {
                    itemEntity.ExpenseId = draft.Id;
                    _expenseItemDal.Add(itemEntity);
                }

                if (!draftDto.TotalAmount.HasValue
                    || Math.Abs(draftDto.TotalAmount.Value - computed.total) > 0.01m)
                {
                    draft.ExcludingVatAmount = computed.excludingVat;
                    draft.Vat = computed.vat;
                    draft.TotalAmount = computed.total;
                    draft.OriginalTotalAmount = computed.total;
                    draft.VatRate = computed.vatRate;
                }
            }

            _expenseDal.Update(draft);

            // uuid snapshot tablosunda (expense_drafts) kalan eski payload, PUT sonrası GET draft/my ile güncellenmemiş veriyi geri göstermesin
            try
            {
                _expenseDraftSnapshotDal.DeleteSnapshotsReferencingExpenseDraftId(uid, draft.Id);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Taslak güncellendi; bağlı uuid snapshot temizliği başarısız (ExpenseDraftId={DraftId}).", draft.Id);
            }

            return new SuccessDataResult<ExpenseDto>(ToDto(draft), "Taslak güncellendi.");
        }

        public IResult DeleteDraft(int draftId)
        {
            if (!_userContext.IsAuthenticated)
                return new ErrorResult("Yetkilendirme gerekli.");

            var uid = _userContext.UserId;
            var draft = _expenseDal.Get(e => e.Id == draftId && e.IsActive && e.UserId == uid && e.Status == StatusDraft);
            if (draft == null)
                return new ErrorResult("Taslak bulunamadı.");

            var requestIdForSnapshot = string.IsNullOrWhiteSpace(draft.RequestId) ? null : draft.RequestId.Trim();

            try
            {
                _expenseDraftSnapshotDal.DeleteSnapshotsReferencingExpenseDraftId(uid, draft.Id);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Taslak silinemeden önce uuid snapshot temizliği başarısız (ExpenseDraftId={DraftId}).", draftId);
            }

            draft.IsActive = false;
            _expenseDal.Update(draft);

            // Snapshot payload'da satır id'si yoksa ilk SQL satır silmez; aynı requestId'ye bağlı başka aktif taslak kalmadıysa talep bazlı snapshot'ı da temizle (tek tıkta kaybolsun).
            if (!string.IsNullOrEmpty(requestIdForSnapshot))
            {
                try
                {
                    var ridNorm = requestIdForSnapshot.Trim();
                    var remainingSameRequest = _expenseDal.GetAll(e =>
                        e.IsActive
                        && e.UserId == uid
                        && e.Status == StatusDraft
                        && !string.IsNullOrEmpty(e.RequestId)
                        && string.Equals(e.RequestId.Trim(), ridNorm, StringComparison.OrdinalIgnoreCase)).Count;

                    if (remainingSameRequest == 0)
                        _expenseDraftSnapshotDal.DeleteSnapshotsForRequestId(uid, ridNorm);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Taslak silindi; requestId bazlı uuid snapshot temizliği başarısız (RequestId={RequestId}).", requestIdForSnapshot);
                }
            }

            return new SuccessResult("Taslak silindi.");
        }

        public IResult DeleteDraftByRequest(string requestId)
        {
            if (!_userContext.IsAuthenticated)
                return new ErrorResult("Yetkilendirme gerekli.");
            if (string.IsNullOrWhiteSpace(requestId))
                return new ErrorResult("Geçersiz requestId.");

            var uid = _userContext.UserId;
            var rid = requestId.Trim();
            var drafts = _expenseDal.GetAll(e => e.IsActive && e.UserId == uid && e.Status == StatusDraft && e.RequestId == rid).ToList();
            if (drafts.Count == 0)
                return new ErrorResult("Taslak bulunamadı.");

            foreach (var d in drafts)
            {
                d.IsActive = false;
                _expenseDal.Update(d);
            }

            try
            {
                _expenseDraftSnapshotDal.DeleteSnapshotsForRequestId(uid, rid);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "RequestId bazlı taslak silindi; uuid snapshot temizliği başarısız (RequestId={RequestId}).", rid);
            }

            return new SuccessResult("Taslaklar silindi.");
        }

        public IDataResult<ExpenseDto> SubmitDraft(int draftId)
        {
            if (!_userContext.IsAuthenticated)
                return new ErrorDataResult<ExpenseDto>("Yetkilendirme gerekli.");

            var uid = _userContext.UserId;
            var draft = _expenseDal.Get(e => e.Id == draftId && e.IsActive && e.UserId == uid && e.Status == StatusDraft);
            if (draft == null)
                return new ErrorDataResult<ExpenseDto>("Taslak bulunamadı.");

            var validate = ValidateDraftForSubmit(draft);
            if (!validate.allowed)
                return new ErrorDataResult<ExpenseDto>(validate.message ?? "Taslak gönderilemedi.");

            // Taslak kaydı "gerçek masraf"a dönüşürken yeni kayıt üretilir, taslak pasife alınır.
            var addDto = BuildAddDtoFromDraft(draft);
            var addResult = AddInternal(addDto, requestIdOverride: draft.RequestId, notifyAdmins: true);
            if (!addResult.Success || addResult.Data == null)
                return new ErrorDataResult<ExpenseDto>(addResult.Message ?? "Taslak gönderilemedi.");

            draft.IsActive = false;
            _expenseDal.Update(draft);

            try
            {
                _expenseDraftSnapshotDal.DeleteSnapshotsReferencingExpenseDraftId(uid, draft.Id);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Taslak gönderildi; uuid snapshot temizliği başarısız (ExpenseDraftId={DraftId}).", draft.Id);
            }

            return new SuccessDataResult<ExpenseDto>(addResult.Data, "Taslak gönderildi.");
        }

        public IDataResult<List<ExpenseDto>> SubmitDraftRequest(string requestId)
        {
            if (!_userContext.IsAuthenticated)
                return new ErrorDataResult<List<ExpenseDto>>("Yetkilendirme gerekli.");
            if (string.IsNullOrWhiteSpace(requestId))
                return new ErrorDataResult<List<ExpenseDto>>("Geçersiz requestId.");

            var uid = _userContext.UserId;
            var rid = requestId.Trim();
            var drafts = _expenseDal.GetAll(e => e.IsActive && e.UserId == uid && e.Status == StatusDraft && e.RequestId == rid).ToList();
            if (drafts.Count == 0)
                return new ErrorDataResult<List<ExpenseDto>>("Taslak bulunamadı.");

            foreach (var d in drafts)
            {
                var validate = ValidateDraftForSubmit(d);
                if (!validate.allowed)
                    return new ErrorDataResult<List<ExpenseDto>>(validate.message ?? "Taslak gönderilemedi.");
            }

            var created = new List<ExpenseDto>();
            foreach (var d in drafts)
            {
                var addDto = BuildAddDtoFromDraft(d);
                var addResult = AddInternal(addDto, requestIdOverride: rid, notifyAdmins: true);
                if (!addResult.Success || addResult.Data == null)
                    return new ErrorDataResult<List<ExpenseDto>>(addResult.Message ?? "Taslaklar gönderilemedi.");
                created.Add(addResult.Data);
            }

            foreach (var d in drafts)
            {
                d.IsActive = false;
                _expenseDal.Update(d);
            }

            try
            {
                foreach (var d in drafts)
                    _expenseDraftSnapshotDal.DeleteSnapshotsReferencingExpenseDraftId(uid, d.Id);
                _expenseDraftSnapshotDal.DeleteSnapshotsForRequestId(uid, rid);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Taslaklar gönderildi; uuid snapshot temizliği başarısız (RequestId={RequestId}).", rid);
            }

            return new SuccessDataResult<List<ExpenseDto>>(created, "Taslaklar gönderildi.");
        }

        private AddExpenseDto BuildAddDtoFromDraft(Expense draft)
        {
            var items = _expenseItemDal.GetAll(i => i.ExpenseId == draft.Id);

            return new AddExpenseDto
            {
                RequestId = draft.RequestId,
                UserId = draft.UserId,
                InvoiceNumber = (draft.InvoiceNumber ?? "").Trim(),
                InvoiceDate = draft.InvoiceDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                ProjectName = (draft.ProjectName ?? "").Trim(),
                InvoiceTitle = (draft.InvoiceTitle ?? "").Trim(),
                ExtraCategorie = draft.ExtraCategorie,
                Description = (draft.Description ?? "").Trim(),
                PersonCount = draft.PersonCount,
                AcceptedDailyAmount = draft.AcceptedDailyAmount,
                UncoveredAmount = draft.UncoveredAmount,
                MealPersonNames = draft.MealPersonNames,
                MealDescription = draft.MealDescription,
                ExpenseType = draft.ExpenseType,
                CurrencyCode = draft.CurrencyCode,
                ExcludingVatAmount = draft.ExcludingVatAmount,
                VatRate = draft.VatRate,
                Vat = draft.Vat,
                TotalAmount = draft.TotalAmount,
                IsPinned = draft.IsPinned,
                Status = "Beklemede",
                ImageData = draft.ImageData == null ? null : Convert.ToBase64String(draft.ImageData),
                ExpensePeriod = draft.ExpensePeriod,
                Items = items.Select(i => new CreateExpenseItemDto
                {
                    ItemName = i.ItemName,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                    KdvRate = i.KdvRate
                }).ToList()
            };
        }

        private void TryNotifyAdminsForExpenseRequest(string requestId)
        {
            // Ürün kararı: admin kuyruğu hatırlatmaları yalnızca Quartz ile Pazartesi 10:25'te gider.
            // Masraf oluşturulurken anında admin bildirimi üretmeyelim.
            return;

            if (string.IsNullOrWhiteSpace(requestId))
                return;
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var runner = scope.ServiceProvider.GetRequiredService<IExpenseReminderRunner>();
                runner.NotifyAdminsForExpenseRequestAsync(requestId, CancellationToken.None).GetAwaiter().GetResult();
            }
            catch (Exception ex)
            {
                // Masraf kaydı başarılı kalsın; bildirim/mail hatası işlemi düşürmez.
                _logger.LogWarning(ex, "Masraf talebi {RequestId} için admin bildirimi/e-posta tetiklenemedi.", requestId);
            }
        }

        private IDataResult<ExpenseDto> AddInternal(AddExpenseDto expenseDto, string? requestIdOverride, bool notifyAdmins = true)
        {
            try
            {
                if (!_userContext.IsAuthenticated)
                    return new ErrorDataResult<ExpenseDto>("Yetkilendirme gerekli.");

                long currentUserId = _userContext.UserId;
                // body.userId geçerli (> 0) ise masraf sahibi o kullanıcı, değilse giriş yapan kullanıcı. Tüm kullanıcılar başkası adına ekleyebilir.
                long targetUserId = expenseDto.UserId > 0 ? expenseDto.UserId : currentUserId;

                var user = _userDal.Get(u => u.Id == targetUserId);
                if (user == null)
                    return new ErrorDataResult<ExpenseDto>("Seçilen kullanıcı bulunamadı.");

                var customerIdResult = ResolveCustomerIdForExpenseOwner(targetUserId, currentUserId);
                if (!customerIdResult.success)
                    return new ErrorDataResult<ExpenseDto>(customerIdResult.message ?? "Kullanıcı-müşteri ilişkisi bulunamadı.");

                var expenseType = NormalizeExpenseType(expenseDto.ExpenseType);
                var status = NormalizeStatus(expenseDto.Status);

                var invoiceDate = ParseInvoiceDate(expenseDto.InvoiceDate);
                string period = NormalizePeriod(expenseDto.ExpensePeriod ?? invoiceDate.ToString("yyyy-MM", CultureInfo.InvariantCulture));
                var (allowed, msg) = IsPeriodAllowedForAdd(period);
                if (!allowed)
                {
                    return new ErrorDataResult<ExpenseDto>(msg ?? "Önceki dönemlere masraf eklenemez. Önceki dönem son giriş gününü kontrol edin.");
                }

                decimal excludingVatAmount = expenseDto.ExcludingVatAmount;
                decimal vat;
                decimal total;
                decimal vatRate;
                var expenseItems = new List<ExpenseItem>();

                if (expenseDto.Items != null && expenseDto.Items.Count > 0)
                {
                    // Kalem UnitPrice alanı bazı ekranlarda KDV DAHİL (gross), bazı ekranlarda KDV HARİÇ (net) gelebiliyor.
                    // Bunu sağlamlaştırmak için iki olası hesabı çıkarıp, eğer payload TotalAmount doluysa ona en yakın olanı seçiyoruz.
                    var expectedTotal = Math.Round(expenseDto.TotalAmount, 2, MidpointRounding.AwayFromZero);

                    // 1) UnitPrice = NET varsayımı
                    decimal net_sumExcluding = 0m, net_sumVat = 0m, net_sumTotal = 0m;
                    // 2) UnitPrice = GROSS varsayımı
                    decimal gross_sumExcluding = 0m, gross_sumVat = 0m, gross_sumTotal = 0m;

                    foreach (var item in expenseDto.Items)
                    {
                        if (item == null || string.IsNullOrWhiteSpace(item.ItemName))
                            return new ErrorDataResult<ExpenseDto>("Masraf kalemi adı zorunludur.");
                        if (item.Quantity <= 0)
                            return new ErrorDataResult<ExpenseDto>("Masraf kalemi adet bilgisi 0'dan büyük olmalıdır.");
                        if (item.UnitPrice < 0)
                            return new ErrorDataResult<ExpenseDto>("Masraf kalemi birim fiyatı negatif olamaz.");
                        if (item.KdvRate < 0 || item.KdvRate > 100)
                            return new ErrorDataResult<ExpenseDto>("Masraf kalemi KDV oranı 0-100 arasında olmalıdır.");

                        // NET varsayımı: gross = net + KDV
                        var net_lineExcluding = Math.Round(item.UnitPrice * item.Quantity, 2, MidpointRounding.AwayFromZero);
                        var net_lineVat = item.KdvRate <= 0
                            ? 0m
                            : Math.Round(net_lineExcluding * item.KdvRate / 100m, 2, MidpointRounding.AwayFromZero);
                        var net_lineTotal = Math.Round(net_lineExcluding + net_lineVat, 2, MidpointRounding.AwayFromZero);

                        net_sumExcluding += net_lineExcluding;
                        net_sumVat += net_lineVat;
                        net_sumTotal += net_lineTotal;

                        // GROSS varsayımı: total verilmiş, net = total/(1+kdv)
                        var gross_lineTotal = Math.Round(item.UnitPrice * item.Quantity, 2, MidpointRounding.AwayFromZero);
                        decimal gross_lineExcluding;
                        decimal gross_lineVat;
                        if (item.KdvRate <= 0)
                        {
                            gross_lineExcluding = gross_lineTotal;
                            gross_lineVat = 0m;
                        }
                        else
                        {
                            var divisor = 1m + (item.KdvRate / 100m);
                            gross_lineExcluding = Math.Round(gross_lineTotal / divisor, 2, MidpointRounding.AwayFromZero);
                            gross_lineVat = Math.Round(gross_lineTotal - gross_lineExcluding, 2, MidpointRounding.AwayFromZero);
                        }

                        gross_sumExcluding += gross_lineExcluding;
                        gross_sumVat += gross_lineVat;
                        gross_sumTotal += gross_lineTotal;
                    }

                    // Beklenen toplam (payload) doluysa ona en yakın olanı seç.
                    // Beklenen toplam yoksa (0 ise), kullanıcı girdisi "toplam" gibi davrandığı için GROSS varsayımını seç.
                    var useGrossUnitPrice = expectedTotal <= 0m ||
                                            Math.Abs(gross_sumTotal - expectedTotal) <= Math.Abs(net_sumTotal - expectedTotal);

                    expenseItems = new List<ExpenseItem>();
                    decimal sumExcluding = 0m;
                    decimal sumVat = 0m;
                    decimal sumTotal = 0m;

                    foreach (var item in expenseDto.Items)
                    {
                        var qty = item.Quantity;
                        var kdv = item.KdvRate;

                        decimal lineTotal;
                        decimal lineExcluding;
                        decimal lineVat;

                        if (useGrossUnitPrice)
                        {
                            lineTotal = Math.Round(item.UnitPrice * qty, 2, MidpointRounding.AwayFromZero);
                            if (kdv <= 0)
                            {
                                lineExcluding = lineTotal;
                                lineVat = 0m;
                            }
                            else
                            {
                                var divisor = 1m + (kdv / 100m);
                                lineExcluding = Math.Round(lineTotal / divisor, 2, MidpointRounding.AwayFromZero);
                                lineVat = Math.Round(lineTotal - lineExcluding, 2, MidpointRounding.AwayFromZero);
                            }
                        }
                        else
                        {
                            lineExcluding = Math.Round(item.UnitPrice * qty, 2, MidpointRounding.AwayFromZero);
                            lineVat = kdv <= 0 ? 0m : Math.Round(lineExcluding * kdv / 100m, 2, MidpointRounding.AwayFromZero);
                            lineTotal = Math.Round(lineExcluding + lineVat, 2, MidpointRounding.AwayFromZero);
                        }

                        sumExcluding += lineExcluding;
                        sumVat += lineVat;
                        sumTotal += lineTotal;

                        // DB: UnitPrice net birim fiyat, TotalAmount KDV dahil satır toplamı
                        expenseItems.Add(new ExpenseItem
                        {
                            ItemName = item.ItemName.Trim(),
                            Quantity = qty,
                            UnitPrice = qty > 0 ? Math.Round(lineExcluding / qty, 2, MidpointRounding.AwayFromZero) : 0m,
                            KdvRate = kdv,
                            TotalAmount = lineTotal,
                            IsKkeg = false
                        });
                    }

                    excludingVatAmount = Math.Round(sumExcluding, 2, MidpointRounding.AwayFromZero);
                    vat = Math.Round(sumVat, 2, MidpointRounding.AwayFromZero);
                    total = Math.Round(sumTotal, 2, MidpointRounding.AwayFromZero);
                    vatRate = excludingVatAmount > 0
                        ? Math.Round((vat / excludingVatAmount) * 100m, 2, MidpointRounding.AwayFromZero)
                        : 0m;
                }
                else
                {
                    var amounts = CalculateAmountsFromRequest(expenseDto.ExcludingVatAmount, expenseDto.TotalAmount, expenseDto.VatRate);
                    excludingVatAmount = amounts.excludingVat;
                    vat = amounts.vat;
                    total = amounts.total;
                    vatRate = expenseDto.VatRate;
                }

                var acceptedDaily = 0m;
                var uncovered = 0m;
                if (IsMealExpense(expenseDto.InvoiceTitle))
                    (acceptedDaily, uncovered) = GetMealAcceptedAndUncovered(expenseDto.PersonCount, total, expenseDto.AcceptedDailyAmount, expenseDto.UncoveredAmount);

                var normalizedBase64Payload = NormalizeImagePayload(expenseDto.ImageData);
                byte[]? imageBytes = normalizedBase64Payload == null ? null : Convert.FromBase64String(normalizedBase64Payload);

                // requestId: bulk/manager override > client payload > new guid
                var incomingRequestId = string.IsNullOrWhiteSpace(requestIdOverride)
                    ? (string.IsNullOrWhiteSpace(expenseDto.RequestId) ? null : expenseDto.RequestId.Trim())
                    : requestIdOverride!.Trim();

                // Revize sonrası yeniden gönderim tespiti:
                // Aynı requestId ile geçmişte Revize Bekliyor veya RevisionReason set edilmiş kayıt varsa,
                // yeni kayıt "Revize Edildi" olarak işaretlenir (frontend marker'a gerek kalmaz).
                if (!string.IsNullOrWhiteSpace(incomingRequestId))
                {
                    var hasRevisionHistory = _expenseDal
                        .GetAll(e => e.RequestId == incomingRequestId
                                     && (e.Status == "Revize Bekliyor" || e.RevisionReason != null))
                        .Any();

                    if (hasRevisionHistory)
                        status = "Revize Edildi";
                }

                var expense = new Expense
                {
                    RequestId = string.IsNullOrWhiteSpace(incomingRequestId) ? Guid.NewGuid().ToString("N") : incomingRequestId!,
                    UserId = targetUserId,
                    CreatedUserId = currentUserId,
                    ExpensePeriod = period,
                    CustomerId = customerIdResult.customerId,
                    InvoiceNumber = expenseDto.InvoiceNumber.Trim(),
                    InvoiceDate = invoiceDate,
                    ProjectName = expenseDto.ProjectName.Trim(),
                    InvoiceTitle = expenseDto.InvoiceTitle.Trim(),
                    ExtraCategorie = string.IsNullOrWhiteSpace(expenseDto.ExtraCategorie) ? null : expenseDto.ExtraCategorie.Trim(),
                    ExpenseType = expenseType,
                    CurrencyCode = ExpenseCurrencyCodes.Normalize(expenseDto.CurrencyCode),
                    Description = expenseDto.Description.Trim(),
                    PersonCount = expenseDto.PersonCount,
                    AcceptedDailyAmount = acceptedDaily,
                    UncoveredAmount = uncovered,
                    MealPersonNames = expenseDto.MealPersonNames?.Trim(),
                    MealDescription = expenseDto.MealDescription?.Trim(),
                    ExcludingVatAmount = excludingVatAmount,
                    VatRate = vatRate,
                    Vat = vat,
                    TotalAmount = total,
                    OriginalTotalAmount = total,
                    HasKkeg = false,
                    Status = status,
                    RejectReason = null,
                    ImageData = imageBytes,
                    IsActive = true,
                    IsPinned = expenseDto.IsPinned,
                };

                if (expenseItems.Count > 0)
                    _expenseDal.AddWithItems(expense, expenseItems);
                else
                    _expenseDal.Add(expense);

                if (notifyAdmins)
                    TryNotifyAdminsForExpenseRequest(expense.RequestId);

                return new SuccessDataResult<ExpenseDto>(ToDto(expense), "Expense added successfully");
            }
            catch (FormatException)
            {
                return new ErrorDataResult<ExpenseDto>("Invalid Base64 format for imageData");
            }
            catch (Exception ex)
            {
                return new ErrorDataResult<ExpenseDto>($"Error adding expense: {ex.Message}");
            }
        }

        [ValidationAspect(typeof(UpdateExpenseDtoValidator))]
        public IDataResult<ExpenseDto> Update(UpdateExpenseDto expenseDto)
        {
            var expense = _expenseDal.Get(e => e.Id == expenseDto.Id && e.IsActive);

            if (expense == null)
                return new ErrorDataResult<ExpenseDto>("Expense not found");

            if (_userContext.IsAuthenticated && !IsAdmin())
            {
                if (expense.UserId != _userContext.UserId)
                    return new ErrorDataResult<ExpenseDto>("Sadece kendi masraflarınızı düzenleyebilirsiniz.");
                if (expense.Status == "Onaylandı" || expense.Status == "Onaylanmadı")
                    return new ErrorDataResult<ExpenseDto>("Onaylanan veya reddedilen masraf düzenlenemez.");
            }

            var expenseType = NormalizeExpenseType(expenseDto.ExpenseType);
            var status = NormalizeStatus(string.IsNullOrWhiteSpace(expenseDto.Status) ? expense.Status : expenseDto.Status);
            var previousStatus = expense.Status;

            var invoiceDate = ParseInvoiceDate(expenseDto.InvoiceDate);
            var calculated = CalculateAmountsFromRequest(expenseDto.ExcludingVatAmount, expenseDto.TotalAmount, expenseDto.VatRate);
            var excludingVatAmount = calculated.excludingVat;
            var vat = calculated.vat;
            var total = calculated.total;
            var acceptedDaily = 0m;
            var uncovered = 0m;
            if (IsMealExpense(expenseDto.InvoiceTitle))
                (acceptedDaily, uncovered) = GetMealAcceptedAndUncovered(expenseDto.PersonCount, total, expenseDto.AcceptedDailyAmount, expenseDto.UncoveredAmount);

            // imageData update kuralı:
            // - null/boş gelirse mevcut kalsın
            // - dolu gelirse normalize edip override et
            if (!string.IsNullOrWhiteSpace(expenseDto.ImageData))
            {
                var normalizedBase64Payload = NormalizeImagePayload(expenseDto.ImageData);
                expense.ImageData = normalizedBase64Payload == null ? null : Convert.FromBase64String(normalizedBase64Payload);
            }

            expense.UserId = expenseDto.UserId;
            expense.InvoiceNumber = expenseDto.InvoiceNumber.Trim();
            expense.InvoiceDate = invoiceDate;
            expense.ProjectName = expenseDto.ProjectName.Trim();
            expense.InvoiceTitle = expenseDto.InvoiceTitle.Trim();
            expense.ExtraCategorie = string.IsNullOrWhiteSpace(expenseDto.ExtraCategorie) ? null : expenseDto.ExtraCategorie.Trim();
            expense.ExpenseType = expenseType;
            if (!string.IsNullOrWhiteSpace(expenseDto.CurrencyCode))
                expense.CurrencyCode = ExpenseCurrencyCodes.Normalize(expenseDto.CurrencyCode);
            expense.Description = expenseDto.Description.Trim();
            expense.PersonCount = expenseDto.PersonCount;
            expense.AcceptedDailyAmount = acceptedDaily;
            expense.UncoveredAmount = uncovered;
            expense.MealPersonNames = expenseDto.MealPersonNames?.Trim();
            expense.MealDescription = expenseDto.MealDescription?.Trim();
            expense.ExcludingVatAmount = excludingVatAmount;
            expense.VatRate = expenseDto.VatRate;
            expense.Vat = vat;
            expense.TotalAmount = total;
            expense.OriginalTotalAmount = total;
            expense.Status = status;
            expense.IsPinned = expenseDto.IsPinned;
            expense.ApprovedUserId = expenseDto.ApprovedUserId;
            if (!string.IsNullOrWhiteSpace(expenseDto.ExpensePeriod))
                expense.ExpensePeriod = NormalizePeriod(expenseDto.ExpensePeriod);

            // Revize sonrası tekrar gönderim: Beklemede'ye dönünce revize metnini temizle
            if (status == "Beklemede" && string.Equals(previousStatus, "Revize Bekliyor", StringComparison.Ordinal))
                expense.RevisionReason = null;

            // Red açıklaması: rejectReason, rejectionReason veya statusReason'dan ilk dolu olanı kaydet
            var reason = !string.IsNullOrWhiteSpace(expenseDto.RejectReason) ? expenseDto.RejectReason.Trim()
                : !string.IsNullOrWhiteSpace(expenseDto.RejectionReason) ? expenseDto.RejectionReason.Trim()
                : !string.IsNullOrWhiteSpace(expenseDto.StatusReason) ? expenseDto.StatusReason.Trim()
                : null;
            if (reason != null)
                expense.RejectReason = reason;

            _expenseDal.Update(expense);
            if (status == "Beklemede" && string.Equals(previousStatus, "Revize Bekliyor", StringComparison.Ordinal))
                TryNotifyAdminsForExpenseRequest(expense.RequestId);

            return new SuccessDataResult<ExpenseDto>(ToDto(expense), "Expense updated successfully");
        }

        public IResult Delete(int id)
        {
            var expense = _expenseDal.Get(e => e.Id == id);
            if (expense == null)
                return new ErrorResult("Expense not found");

            if (_userContext.IsAuthenticated && !IsAdmin())
            {
                if (expense.UserId != _userContext.UserId)
                    return new ErrorResult("Sadece kendi masraflarınızı silebilirsiniz.");
                if (expense.Status == "Onaylandı")
                    return new ErrorResult("Onaylanan masraf silinemez.");
            }

            expense.IsActive = false;
            _expenseDal.Update(expense);
            return new SuccessResult("Expense deleted successfully");
        }

        /// <summary>Normal kullanıcı sadece kendi masraflarını görür (userId yoksa veya farklıysa giriş yapan kullanıcı id'si kullanılır). Admin istediği userId ile çağırabilir.</summary>
        public IDataResult<List<ExpenseDto>> GetAllByUserId(long userId)
        {
            if (!_userContext.IsAuthenticated)
                return new ErrorDataResult<List<ExpenseDto>>("Yetkilendirme gerekli.");

            long effectiveUserId = userId;
            if (!IsAdmin())
                effectiveUserId = _userContext.UserId;

            var expenses = _expenseDal
                .GetAll(e => e.UserId == effectiveUserId && e.IsActive && e.Status != StatusDraft)
                .OrderByDescending(e => e.InvoiceDate)
                .ToList();

            var dtos = expenses.Select(e => ToDto(e)).ToList();
            return new SuccessDataResult<List<ExpenseDto>>(dtos, "Expenses retrieved successfully");
        }

        /// <summary>Normal kullanıcı sadece kendi masraflarını görebilir.</summary>
        public IDataResult<ExpenseDto> GetById(int id)
        {
            var expense = _expenseDal.Get(e => e.Id == id && e.IsActive);
            if (expense == null)
                return new ErrorDataResult<ExpenseDto>("Expense not found");
            if (_userContext.IsAuthenticated && !IsAdmin() && expense.UserId != _userContext.UserId)
                return new ErrorDataResult<ExpenseDto>("Bu masrafı görüntüleme yetkiniz yok.");
            return new SuccessDataResult<ExpenseDto>(ToDto(expense), "Expense retrieved successfully");
        }

        public IDataResult<ExpenseDetailDto> GetDetailById(int id)
        {
            var expense = _expenseDal.Get(e => e.Id == id && e.IsActive);
            if (expense == null)
                return new ErrorDataResult<ExpenseDetailDto>("Masraf bulunamadı.");
            if (_userContext.IsAuthenticated && !IsAdmin() && expense.UserId != _userContext.UserId)
                return new ErrorDataResult<ExpenseDetailDto>("Bu masrafı görüntüleme yetkiniz yok.");

            return new SuccessDataResult<ExpenseDetailDto>(ToDetailDto(expense), "Masraf detayı getirildi.");
        }

        public IDataResult<List<ExpenseDto>> BulkAdd(BulkAddExpenseDto bulkDto)
        {
            if (bulkDto?.Expenses == null || bulkDto.Expenses.Count == 0)
                return new ErrorDataResult<List<ExpenseDto>>("En az bir masraf gönderilmelidir.");
            var added = new List<ExpenseDto>();
            var requestId = Guid.NewGuid().ToString("N");
            foreach (var dto in bulkDto.Expenses)
            {
                var result = AddInternal(dto, requestIdOverride: requestId, notifyAdmins: false);
                if (!result.Success)
                    return new ErrorDataResult<List<ExpenseDto>>($"Çoklu ekleme sırasında hata: {result.Message}");
                if (result.Data != null)
                    added.Add(result.Data);
            }
            TryNotifyAdminsForExpenseRequest(requestId);
            return new SuccessDataResult<List<ExpenseDto>>(added, $"{added.Count} masraf eklendi.");
        }

        [ValidationAspect(typeof(BulkInsertExpenseRequestDtoValidator))]
        [TransactionScopeAspect]
        public IDataResult<List<ExpenseDto>> BulkInsert(BulkInsertExpenseRequestDto request, IReadOnlyList<string>? imagePathsByIndex = null)
        {
            if (!_userContext.IsAuthenticated)
                return new ErrorDataResult<List<ExpenseDto>>("Yetkilendirme gerekli.");

            long createdBy = _userContext.UserId;
            var requestId = Guid.NewGuid().ToString("N");
            var entities = new List<Expense>();

            for (var i = 0; i < request.Expenses.Count; i++)
            {
                var item = request.Expenses[i];
                if (item == null)
                    return new ErrorDataResult<List<ExpenseDto>>($"Masraf öğesi ({i + 1}) boş olamaz.");

                var user = _userDal.Get(u => u.Id == item.UserId);
                if (user == null)
                    return new ErrorDataResult<List<ExpenseDto>>($"Kullanıcı bulunamadı (UserId: {item.UserId}).");

                var customerIdResult = ResolveCustomerIdForExpenseOwner(item.UserId, createdBy);
                if (!customerIdResult.success)
                    return new ErrorDataResult<List<ExpenseDto>>(
                        $"Kullanıcı-müşteri ilişkisi bulunamadı (UserId: {item.UserId}).");

                var invoiceDate = ParseInvoiceDate(item.InvoiceDate);
                string period = NormalizePeriod(item.ExpensePeriod ?? invoiceDate.ToString("yyyy-MM", CultureInfo.InvariantCulture));
                var (allowed, msg) = IsPeriodAllowedForAdd(period);
                if (!allowed)
                    return new ErrorDataResult<List<ExpenseDto>>(msg ?? $"Önceki dönemlere masraf eklenemez. Satır {i + 1}: {period}");

                // Bulk create: kalem bazlı gönderim yok; TotalAmount/ExcludingVatAmount/VatRate alanlarından üret.
                var calculated = CalculateAmountsFromRequest(item.ExcludingVatAmount, 0m, item.VatRate);
                var excludingVatAmount = calculated.excludingVat;
                var vat = calculated.vat;
                var total = calculated.total;
                var acceptedDaily = 0m;
                var uncovered = 0m;
                if (IsMealExpense(item.InvoiceTitle))
                    (acceptedDaily, uncovered) = GetMealAcceptedAndUncovered(item.PersonCount, total, item.AcceptedDailyAmount, item.UncoveredAmount);
                var expenseType = NormalizeExpenseType(item.ExpenseType);

                byte[]? imageBytes = null;
                if (!string.IsNullOrWhiteSpace(item.ImageData))
                {
                    try
                    {
                        var normalized = NormalizeImagePayload(item.ImageData);
                        if (normalized != null)
                            imageBytes = Convert.FromBase64String(normalized);
                    }
                    catch (FormatException)
                    {
                        return new ErrorDataResult<List<ExpenseDto>>($"Satır {i + 1}: Geçersiz Base64 imageData.");
                    }
                }

                string? imagePath = null;
                if (item.ImageFileIndex.HasValue && imagePathsByIndex != null
                    && item.ImageFileIndex.Value >= 0 && item.ImageFileIndex.Value < imagePathsByIndex.Count)
                    imagePath = imagePathsByIndex[item.ImageFileIndex.Value];

                var expense = new Expense
                {
                    RequestId = requestId,
                    UserId = item.UserId,
                    CreatedUserId = createdBy,
                    ExpensePeriod = period,
                    CustomerId = customerIdResult.customerId,
                    InvoiceNumber = item.InvoiceNumber.Trim(),
                    InvoiceDate = invoiceDate,
                    ProjectName = item.ProjectName.Trim(),
                    InvoiceTitle = item.InvoiceTitle.Trim(),
                    ExtraCategorie = string.IsNullOrWhiteSpace(item.ExtraCategorie) ? null : item.ExtraCategorie.Trim(),
                    ExpenseType = expenseType,
                    CurrencyCode = ExpenseCurrencyCodes.Normalize(item.CurrencyCode),
                    Description = item.Description.Trim(),
                    PersonCount = item.PersonCount,
                    AcceptedDailyAmount = acceptedDaily,
                    UncoveredAmount = uncovered,
                    MealPersonNames = item.MealPersonNames?.Trim(),
                    MealDescription = item.MealDescription?.Trim(),
                    ExcludingVatAmount = excludingVatAmount,
                    VatRate = item.VatRate,
                    Vat = vat,
                    TotalAmount = total,
                    OriginalTotalAmount = total,
                    HasKkeg = false,
                    Status = "Beklemede",
                    ImageData = imageBytes,
                    ImagePath = imagePath,
                    IsActive = true,
                    IsPinned = item.IsPinned,
                };
                entities.Add(expense);
            }

            _expenseDal.AddRange(entities);
            var dtos = entities.Select(e => ToDto(e)).ToList();
            TryNotifyAdminsForExpenseRequest(requestId);
            return new SuccessDataResult<List<ExpenseDto>>(dtos, $"{dtos.Count} masraf eklendi.");
        }

        public IDataResult<List<ExpenseDto>> GetFiltered(ExpenseFilterDto filter)
        {
            if (!_userContext.IsAuthenticated)
                return new ErrorDataResult<List<ExpenseDto>>("Yetkilendirme gerekli.");

            long effectiveUserId = filter?.UserId ?? 0;
            if (!IsAdmin())
                effectiveUserId = _userContext.UserId;
            else
            {
                // Admin: userId yoksa artık varsayılan "tümü" değil — Masraflarım/export yanlışlıkla tüm şirketi dışa aktarmasın.
                // Tüm kullanıcılar: IncludeAllUsers=true VEYA admin paneli için getAllForAdmin kullanın.
                if (effectiveUserId <= 0)
                {
                    if (filter?.IncludeAllUsers == true)
                        effectiveUserId = 0;
                    else
                        effectiveUserId = _userContext.UserId;
                }
            }

            IEnumerable<Expense> query = _expenseDal.GetAll(e => e.IsActive && e.Status != StatusDraft && (
                effectiveUserId == 0
                || e.UserId == effectiveUserId
                || e.CreatedUserId == effectiveUserId));
            query = ApplyCommonExpenseFilters(query, filter, includeSearch: false);

            var ordered = (filter?.SortByPinnedFirst ?? true)
                ? query.OrderByDescending(e => e.IsPinned).ThenByDescending(e => e.InvoiceDate)
                : query.OrderByDescending(e => e.InvoiceDate);
            var page = ordered.ToList();
            var list = MapExpensesToDtos(page);
            return new SuccessDataResult<List<ExpenseDto>>(list, "Liste getirildi.");
        }

        /// <summary>Admin: Tüm kullanıcıların masraflarını döner. Skip, Limit, Search, UserId, Period, Status, MinAmount, MaxAmount, PinnedFirst desteklenir.</summary>
        public IDataResult<List<ExpenseDto>> GetAllForAdmin(ExpenseFilterDto filter)
        {
            try
            {
                if (!_userContext.IsAuthenticated)
                    return new ErrorDataResult<List<ExpenseDto>>("Yetkilendirme gerekli.");
                if (!IsAdmin())
                    return new ErrorDataResult<List<ExpenseDto>>("Bu işlem sadece admin kullanıcılar içindir.");

                IEnumerable<Expense> query = _expenseDal.GetAll(e => e.IsActive && e.Status != StatusDraft);
                if (filter?.UserId.HasValue == true && filter.UserId.Value > 0)
                    query = query.Where(e => e.UserId == filter.UserId.Value);
                query = ApplyCommonExpenseFilters(query, filter, includeSearch: true);

                bool sortByPinned = filter?.PinnedFirst ?? filter?.SortByPinnedFirst ?? true;
                var ordered = sortByPinned
                    ? query.OrderByDescending(e => e.IsPinned).ThenByDescending(e => e.InvoiceDate)
                    : query.OrderByDescending(e => e.InvoiceDate);
                int skip = filter?.Skip ?? 0;
                int take = filter?.Limit ?? 500;
                if (skip < 0) skip = 0;
                if (take <= 0 || take > 1000) take = 500;
                var page = ordered.Skip(skip).Take(take).ToList();
                var list = MapExpensesToDtos(page);
                return new SuccessDataResult<List<ExpenseDto>>(list, "Liste getirildi.");
            }
            catch (Exception ex)
            {
                return new ErrorDataResult<List<ExpenseDto>>(
                    $"Masraf listesi alınamadı: {ex.Message}");
            }
        }

        [SecuredOperation(RoleNames.Admin)]
        public IDataResult<ExpenseDetailDto> Approve(ApproveExpenseDto dto)
        {
            if (dto == null || dto.ExpenseId <= 0)
                return new ErrorDataResult<ExpenseDetailDto>("Geçersiz onay isteği.");

            var expense = _expenseDal.Get(e => e.Id == dto.ExpenseId && e.IsActive);
            if (expense == null)
                return new ErrorDataResult<ExpenseDetailDto>("Masraf bulunamadı.");

            var items = _expenseItemDal.GetAll(i => i.ExpenseId == expense.Id);
            var kkegIds = (dto.KkegItemIds ?? new List<int>()).Distinct().ToHashSet();
            var itemsById = items.ToDictionary(i => i.Id, i => i);

            foreach (var reqId in kkegIds)
            {
                if (!itemsById.ContainsKey(reqId))
                    return new ErrorDataResult<ExpenseDetailDto>($"Seçilen kalem bulunamadı veya masrafa ait değil. KalemId: {reqId}");
            }

            foreach (var item in items)
            {
                item.IsKkeg = kkegIds.Contains(item.Id);
                _expenseItemDal.Update(item);
            }

            expense.HasKkeg = kkegIds.Count > 0;
            expense.IsKkeg = expense.HasKkeg;

            var originalTotal = expense.OriginalTotalAmount > 0 ? expense.OriginalTotalAmount : expense.TotalAmount;
            var kkegTotal = items.Where(i => i.IsKkeg).Sum(i => i.TotalAmount);
            var autoApproved = Math.Max(0m, originalTotal - kkegTotal);

            if (dto.ApprovedTotalAmountOverride.HasValue)
            {
                var ov = dto.ApprovedTotalAmountOverride.Value;
                if (ov < 0 || ov > originalTotal)
                    return new ErrorDataResult<ExpenseDetailDto>("Onaylanan tutar 0 ile fatura toplamı arasında olmalıdır.");
                expense.ApprovedTotalAmount = ov;
            }
            else
            {
                expense.ApprovedTotalAmount = autoApproved;
            }

            expense.Status = "Onaylandı";
            expense.ApprovedUserId = _userContext.UserId;
            expense.RevisionReason = null;
            _expenseDal.Update(expense);

            return new SuccessDataResult<ExpenseDetailDto>(ToDetailDto(expense), "Masraf onaylandı.");
        }

        [SecuredOperation(RoleNames.Admin)]
        [TransactionScopeAspect]
        public IDataResult<List<ExpenseDetailDto>> ApproveRequest(string requestId, Entities.DTOs.ExpenseDto.ApproveExpenseRequestDto dto)
        {
            if (string.IsNullOrWhiteSpace(requestId))
                return new ErrorDataResult<List<ExpenseDetailDto>>("Geçersiz requestId.");
            if (dto?.Items == null || dto.Items.Count == 0)
                return new ErrorDataResult<List<ExpenseDetailDto>>("En az bir öğe gönderilmelidir.");

            var byId = dto.Items
                .Where(i => i != null && i.ExpenseId > 0)
                .GroupBy(i => i.ExpenseId)
                .ToDictionary(g => g.Key, g => g.First());

            var expenses = _expenseDal.GetAll(e => e.IsActive && e.RequestId == requestId).ToList();
            if (expenses.Count == 0)
                return new ErrorDataResult<List<ExpenseDetailDto>>("Talep bulunamadı.");

            var resultList = new List<ExpenseDetailDto>();
            foreach (var expense in expenses)
            {
                if (!byId.TryGetValue(expense.Id, out var item))
                    continue; // payload'da yoksa atla

                var items = _expenseItemDal.GetAll(i => i.ExpenseId == expense.Id);
                var kkegIds = (item.KkegItemIds ?? new List<int>()).Distinct().ToHashSet();
                var itemsById = items.ToDictionary(i => i.Id, i => i);

                foreach (var reqId in kkegIds)
                {
                    if (!itemsById.ContainsKey(reqId))
                        return new ErrorDataResult<List<ExpenseDetailDto>>($"Seçilen kalem bulunamadı veya masrafa ait değil. KalemId: {reqId}");
                }

                foreach (var it in items)
                {
                    it.IsKkeg = kkegIds.Contains(it.Id);
                    _expenseItemDal.Update(it);
                }

                expense.HasKkeg = kkegIds.Count > 0;
                expense.IsKkeg = expense.HasKkeg;

                var originalTotal = expense.OriginalTotalAmount > 0 ? expense.OriginalTotalAmount : expense.TotalAmount;
                var kkegTotal = items.Where(i => i.IsKkeg).Sum(i => i.TotalAmount);
                var autoApproved = Math.Max(0m, originalTotal - kkegTotal);

                if (item.ApprovedTotalAmountOverride.HasValue)
                {
                    var ov = item.ApprovedTotalAmountOverride.Value;
                    if (ov < 0 || ov > originalTotal)
                        return new ErrorDataResult<List<ExpenseDetailDto>>("Onaylanan tutar 0 ile fatura toplamı arasında olmalıdır.");
                    expense.ApprovedTotalAmount = ov;
                }
                else
                {
                    expense.ApprovedTotalAmount = autoApproved;
                }

                expense.Status = "Onaylandı";
                expense.ApprovedUserId = _userContext.UserId;
                expense.RevisionReason = null;
                _expenseDal.Update(expense);
                resultList.Add(ToDetailDto(expense));
            }

            TryNotifyExpenseOwnerApproved(requestId, expenses, resultList);
            return new SuccessDataResult<List<ExpenseDetailDto>>(resultList, "Talep onaylandı.");
        }

        [SecuredOperation(RoleNames.Admin)]
        public IResult Reject(int id)
        {
            var expense = _expenseDal.Get(e => e.Id == id && e.IsActive);
            if (expense == null)
                return new ErrorResult("Masraf bulunamadı.");
            expense.Status = "Onaylanmadı";
            expense.ApprovedUserId = _userContext.UserId;
            expense.RevisionReason = null;
            _expenseDal.Update(expense);
            return new SuccessResult("Masraf reddedildi.");
        }

        [SecuredOperation(RoleNames.Admin)]
        [TransactionScopeAspect]
        public IResult RejectRequest(string requestId, Entities.DTOs.ExpenseDto.RejectExpenseRequestDto dto)
        {
            if (string.IsNullOrWhiteSpace(requestId))
                return new ErrorResult("Geçersiz requestId.");
            if (dto == null || string.IsNullOrWhiteSpace(dto.Reason))
                return new ErrorResult("Red sebebi zorunludur.");

            var expenses = _expenseDal.GetAll(e => e.IsActive && e.RequestId == requestId).ToList();
            if (expenses.Count == 0)
                return new ErrorResult("Talep bulunamadı.");

            var reason = dto.Reason.Trim();
            foreach (var e in expenses)
            {
                e.Status = "Onaylanmadı";
                e.RejectReason = reason;
                e.RevisionReason = null;
                e.ApprovedUserId = _userContext.UserId;
                if (string.IsNullOrWhiteSpace(e.ExpenseType) && !string.IsNullOrWhiteSpace(dto.ExpenseTypeFallback))
                    e.ExpenseType = NormalizeExpenseType(dto.ExpenseTypeFallback);
                _expenseDal.Update(e);
            }

            TryNotifyExpenseOwnerRejected(requestId, expenses, reason);
            return new SuccessResult("Talep reddedildi.");
        }

        [SecuredOperation(RoleNames.Admin)]
        [TransactionScopeAspect]
        public IDataResult<List<ExpenseDto>> RevisionRequest(string requestId, Entities.DTOs.ExpenseDto.RevisionExpenseRequestDto dto)
        {
            if (string.IsNullOrWhiteSpace(requestId))
                return new ErrorDataResult<List<ExpenseDto>>("Geçersiz requestId.");
            if (dto == null || string.IsNullOrWhiteSpace(dto.Reason))
                return new ErrorDataResult<List<ExpenseDto>>("Revize sebebi zorunludur.");

            var expenses = _expenseDal.GetAll(e => e.IsActive && e.RequestId == requestId).ToList();
            if (expenses.Count == 0)
                return new ErrorDataResult<List<ExpenseDto>>("Talep bulunamadı.");

            var notAllowed = expenses.Where(e => e.Status != "Beklemede" && e.Status != "Revize Edildi").ToList();
            if (notAllowed.Count > 0)
            {
                return new ErrorDataResult<List<ExpenseDto>>(
                    "Talep içindeki tüm masrafların durumu 'Beklemede' veya 'Revize Edildi' olmalıdır (onaylanmış, reddedilmiş veya revize bekleyen kayıt olmamalı).");
            }

            var reason = dto.Reason.Trim();
            foreach (var e in expenses)
            {
                e.Status = "Revize Bekliyor";
                e.RevisionReason = reason;
                e.RejectReason = null;
                e.ApprovedUserId = _userContext.UserId;
                if (string.IsNullOrWhiteSpace(e.ExpenseType) && !string.IsNullOrWhiteSpace(dto.ExpenseTypeFallback))
                    e.ExpenseType = NormalizeExpenseType(dto.ExpenseTypeFallback);
                _expenseDal.Update(e);
            }

            var dtos = MapExpensesToDtos(expenses);
            TryNotifyExpenseOwnerRevisionRequested(requestId, expenses, reason);
            return new SuccessDataResult<List<ExpenseDto>>(dtos, "Revize talebi oluşturuldu.");
        }

        private void TryNotifyExpenseOwnerRevisionRequested(string requestId, List<Expense> expenses, string reason)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(requestId) || expenses == null || expenses.Count == 0)
                    return;

                var ownerId = expenses[0].UserId;
                var owner = _userDal.Get(u => u.Id == ownerId && u.IsActive);
                if (owner == null || string.IsNullOrWhiteSpace(owner.Email))
                    return;

                var actor = _userDal.Get(u => u.Id == _userContext.UserId && u.IsActive);
                var actorName = (actor?.Name ?? "").Trim();

                var now = DateTime.Now;
                var display8 = RequestDisplayCode.FormatRequestDisplayCode8(requestId);
                var formNo = display8;
                var link = BuildExpenseRequestLink(requestId);

                var html = ExpenseWorkflowMailTemplates.BuildRevisionHtml(
                    olusturanAdi: (owner.Name ?? "").Trim(),
                    formNo: formNo,
                    duzeltmeIsteyen: string.IsNullOrWhiteSpace(actorName) ? "Mali İşler" : actorName,
                    duzeltmeTarihi: now,
                    duzeltmeNedeni: reason,
                    duzeltmeLink: link);

                using var scope = _scopeFactory.CreateScope();
                var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                var content = $"Talep {display8}" + (string.IsNullOrWhiteSpace(reason) ? "" : $" · Neden: {reason}");
                notificationService.Add(new AddNotificationDto
                {
                    AssignedUserId = ownerId,
                    Title = "Revize talep edildi",
                    Content = content,
                    Type = NotificationTypeKeys.ExpenseRevisionRequested,
                    ReferenceId = requestId
                });

                var smtp = scope.ServiceProvider.GetRequiredService<ISmtpMailParametersProvider>();
                var mp = smtp.GetUsableParameters();
                if (mp == null)
                {
                    _logger.LogWarning("Revize maili atlanıyor: SMTP yapılandırması yok. RequestId={RequestId}", requestId);
                    return;
                }

                var mailService = scope.ServiceProvider.GetRequiredService<IMailService>();
                mailService.SendMail(new SendMailDto
                {
                    MailParameters = mp,
                    ToEmail = owner.Email.Trim(),
                    Subject = $"Masraf formu için düzeltme talebi var · Talep {display8}",
                    Body = html
                });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Revize talebi mail/bildirim gönderimi başarısız. RequestId={RequestId}", requestId);
            }
        }

        private void TryNotifyExpenseOwnerRejected(string requestId, List<Expense> expenses, string reason)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(requestId) || expenses == null || expenses.Count == 0)
                    return;

                var ownerId = expenses[0].UserId;
                var owner = _userDal.Get(u => u.Id == ownerId && u.IsActive);
                if (owner == null || string.IsNullOrWhiteSpace(owner.Email))
                    return;

                var actor = _userDal.Get(u => u.Id == _userContext.UserId && u.IsActive);
                var actorName = (actor?.Name ?? "").Trim();

                var now = DateTime.Now;
                var display8 = RequestDisplayCode.FormatRequestDisplayCode8(requestId);
                var formNo = display8;
                var link = BuildExpenseRequestLink(requestId);

                var html = ExpenseWorkflowMailTemplates.BuildRejectHtml(
                    formNo: formNo,
                    iptalEden: string.IsNullOrWhiteSpace(actorName) ? "Mali İşler" : actorName,
                    iptalTarihi: now,
                    iptalNedeni: reason,
                    detayLink: link);

                using var scope = _scopeFactory.CreateScope();
                var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                var content = $"Talep {display8}" + (string.IsNullOrWhiteSpace(reason) ? "" : $" · Neden: {reason}");
                notificationService.Add(new AddNotificationDto
                {
                    AssignedUserId = ownerId,
                    Title = "Reddedildi",
                    Content = content,
                    Type = NotificationTypeKeys.ExpenseRejected,
                    ReferenceId = requestId
                });

                var smtp = scope.ServiceProvider.GetRequiredService<ISmtpMailParametersProvider>();
                var mp = smtp.GetUsableParameters();
                if (mp == null)
                {
                    _logger.LogWarning("Red maili atlanıyor: SMTP yapılandırması yok. RequestId={RequestId}", requestId);
                    return;
                }

                var mailService = scope.ServiceProvider.GetRequiredService<IMailService>();
                mailService.SendMail(new SendMailDto
                {
                    MailParameters = mp,
                    ToEmail = owner.Email.Trim(),
                    Subject = $"Masraf formu reddedildi · Talep {display8}",
                    Body = html
                });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Red mail/bildirim gönderimi başarısız. RequestId={RequestId}", requestId);
            }
        }

        private void TryNotifyExpenseOwnerApproved(string requestId, List<Expense> expenses, List<ExpenseDetailDto> approvedDtos)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(requestId) || expenses == null || expenses.Count == 0)
                    return;

                var ownerId = expenses[0].UserId;
                var owner = _userDal.Get(u => u.Id == ownerId && u.IsActive);
                if (owner == null || string.IsNullOrWhiteSpace(owner.Email))
                    return;

                var actor = _userDal.Get(u => u.Id == _userContext.UserId && u.IsActive);
                var actorName = (actor?.Name ?? "").Trim();

                var now = DateTime.Now;
                var display8 = RequestDisplayCode.FormatRequestDisplayCode8(requestId);
                var formNo = display8;
                var link = BuildExpenseRequestLink(requestId);

                decimal totalApproved = 0m;
                if (approvedDtos != null && approvedDtos.Count > 0)
                {
                    foreach (var d in approvedDtos)
                        totalApproved += d?.ApprovedTotalAmount ?? 0m;
                }
                else
                {
                    foreach (var e in expenses)
                        totalApproved += e.ApprovedTotalAmount ?? 0m;
                }

                var html = ExpenseWorkflowMailTemplates.BuildApproveHtml(
                    olusturanAdi: (owner.Name ?? "").Trim(),
                    formNo: formNo,
                    onaylayan: string.IsNullOrWhiteSpace(actorName) ? "Mali İşler" : actorName,
                    onayTarihi: now,
                    toplamTutar: totalApproved,
                    detayLink: link);

                using var scope = _scopeFactory.CreateScope();
                var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                var content = $"Talep {display8} · Toplam: {totalApproved:0.##} TL";
                notificationService.Add(new AddNotificationDto
                {
                    AssignedUserId = ownerId,
                    Title = "Onaylandı",
                    Content = content,
                    Type = NotificationTypeKeys.ExpenseApproved,
                    ReferenceId = requestId
                });

                var smtp = scope.ServiceProvider.GetRequiredService<ISmtpMailParametersProvider>();
                var mp = smtp.GetUsableParameters();
                if (mp == null)
                {
                    _logger.LogWarning("Onay maili atlanıyor: SMTP yapılandırması yok. RequestId={RequestId}", requestId);
                    return;
                }

                var mailService = scope.ServiceProvider.GetRequiredService<IMailService>();
                mailService.SendMail(new SendMailDto
                {
                    MailParameters = mp,
                    ToEmail = owner.Email.Trim(),
                    Subject = $"Masraf formu onaylandı · Talep {display8}",
                    Body = html
                });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Onay mail/bildirim gönderimi başarısız. RequestId={RequestId}", requestId);
            }
        }

        private string BuildExpenseRequestLink(string requestId)
        {
            var baseUrl = _portalAppUrlProvider.GetAppBaseUrl().Trim().TrimEnd('/');
            if (string.IsNullOrWhiteSpace(baseUrl))
            {
                _logger.LogWarning("AppSettings:AppUrl boş; masraf talep linki üretilemedi.");
                return string.Empty;
            }

            return $"{baseUrl}/dashboard/my-expenses?requestId={Uri.EscapeDataString(requestId)}";
        }

        // ShortRef kaldırıldı; talep kodu her yerde FormatRequestDisplayCode8 ile üretilir.

        public IDataResult<ExpenseDto> TogglePin(int id)
        {
            var expense = _expenseDal.Get(e => e.Id == id && e.IsActive);
            if (expense == null)
                return new ErrorDataResult<ExpenseDto>("Masraf bulunamadı.");
            if (_userContext.IsAuthenticated && !IsAdmin() && expense.UserId != _userContext.UserId)
                return new ErrorDataResult<ExpenseDto>("Sadece kendi masraflarınızı sabitleyebilirsiniz.");
            expense.IsPinned = !expense.IsPinned;
            _expenseDal.Update(expense);
            return new SuccessDataResult<ExpenseDto>(ToDto(expense), expense.IsPinned ? "Üste sabitlendi." : "Sabitleme kaldırıldı.");
        }

        public IDataResult<List<ExpenseCurrencyOptionDto>> GetSupportedCurrencies()
        {
            var list = ExpenseCurrencyCodes.Options
                .Select(o => new ExpenseCurrencyOptionDto { Code = o.Code, NameTr = o.NameTr, Symbol = o.Symbol })
                .ToList();
            return new SuccessDataResult<List<ExpenseCurrencyOptionDto>>(list, "Para birimleri.");
        }

        public IDataResult<byte[]> ExportToExcel(ExpenseFilterDto filter)
        {
            var listResult = GetFiltered(filter ?? new ExpenseFilterDto());
            if (!listResult.Success)
                return new ErrorDataResult<byte[]>(listResult.Message);
            if (listResult.Data == null || listResult.Data.Count == 0)
                return new ErrorDataResult<byte[]>("Dışa aktarılacak masraf bulunamadı.");
            var ownerIds = listResult.Data.Select(x => x.UserId).Distinct().ToList();
            var ownerUsers = _userDal.GetAll(u => ownerIds.Contains(u.Id));
            var ownerNameByUserId = ownerUsers
                .GroupBy(u => u.Id)
                .ToDictionary(g => g.Key, g => g.FirstOrDefault()?.Name);

            var bytes = ExpenseExportToExcel.Export(listResult.Data, ownerNameByUserId);
            return new SuccessDataResult<byte[]>(bytes, "Excel hazır.");
        }

        public IDataResult<byte[]> ExportToPdf(ExpenseFilterDto filter)
        {
            var f = filter ?? new ExpenseFilterDto();
            var isAdmin = IsAdmin();

            // Scope kuralı:
            // 1) userId varsa sadece o kullanıcı
            // 2) includeAllUsers=true yalnızca admin için
            // 3) ikisi de yoksa güvenli default: auth kullanıcısı
            if (f.UserId.HasValue && f.UserId.Value > 0)
            {
                f.IncludeAllUsers = false;
            }
            else if (!(isAdmin && f.IncludeAllUsers == true))
            {
                f.UserId = _userContext.UserId;
                f.IncludeAllUsers = false;
            }

            var listResult = GetFiltered(f);
            if (!listResult.Success)
                return new ErrorDataResult<byte[]>(listResult.Message);
            if (listResult.Data == null || listResult.Data.Count == 0)
                return new ErrorDataResult<byte[]>("Dışa aktarılacak masraf bulunamadı.");

            var ownerName = ResolveOwnerDisplayForPdf(f);
            var periodText = FormatPeriodDisplayForPdf(f.Period);

            var bytes = ExpenseExportToPdf.Generate(
                listResult.Data,
                ownerName,
                periodText,
                DateTime.Now);

            return new SuccessDataResult<byte[]>(bytes, "PDF hazır.");
        }

        public IDataResult<byte[]> ExportSingleToPdf(int id)
        {
            var expense = _expenseDal.Get(e => e.Id == id && e.IsActive);
            if (expense == null)
                return new ErrorDataResult<byte[]>("Masraf bulunamadı.");

            // Tekil PDF için erişim: admin tümü, diğer kullanıcı sadece kendi oluşturdukları.
            if (_userContext.IsAuthenticated && !IsAdmin() && expense.CreatedUserId != _userContext.UserId)
                return new ErrorDataResult<byte[]>("Bu masrafı görüntüleme yetkiniz yok.");

            var dto = ToDto(expense);
            var ownerUser = _userDal.Get(u => u.Id == dto.UserId);
            var ownerName = string.IsNullOrWhiteSpace(ownerUser?.Name) ? $"Kullanıcı #{dto.UserId}" : ownerUser!.Name!;
            var bytes = ExpenseSingleExportToPdf.Generate(dto, ownerName, DateTime.Now);
            return new SuccessDataResult<byte[]>(bytes, "Tekil PDF hazir.");
        }

        private string ResolveOwnerDisplayForPdf(ExpenseFilterDto filter)
        {
            if (!IsAdmin())
            {
                var self = _userDal.Get(u => u.Id == _userContext.UserId);
                return string.IsNullOrWhiteSpace(self?.Name) ? $"Kullanıcı #{_userContext.UserId}" : self!.Name!;
            }

            if (filter.UserId.HasValue && filter.UserId.Value > 0)
            {
                var u = _userDal.Get(x => x.Id == filter.UserId.Value);
                return string.IsNullOrWhiteSpace(u?.Name) ? $"Kullanıcı #{filter.UserId}" : u!.Name!;
            }

            if (filter.IncludeAllUsers == true)
                return "Tüm kullanıcılar";

            var adminSelf = _userDal.Get(u => u.Id == _userContext.UserId);
            return string.IsNullOrWhiteSpace(adminSelf?.Name) ? $"Kullanıcı #{_userContext.UserId}" : adminSelf!.Name!;
        }

        private static string FormatPeriodDisplayForPdf(string? period)
        {
            if (string.IsNullOrWhiteSpace(period))
                return "Tümü";

            var p = period.Trim();
            if (DateTime.TryParseExact(p + "-01", "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt))
            {
                var tr = CultureInfo.GetCultureInfo("tr-TR");
                return $"{tr.DateTimeFormat.GetMonthName(dt.Month)} {dt.Year}";
            }

            return p;
        }

        private static (decimal vat, decimal total) CalculateAmounts(decimal excludingVatAmount, decimal vatRate)
        {
            var vat = Math.Round(excludingVatAmount * vatRate / 100m, 2, MidpointRounding.AwayFromZero);
            var total = Math.Round(excludingVatAmount + vat, 2, MidpointRounding.AwayFromZero);
            return (vat, total);
        }

        /// <summary>
        /// KDV dahil brüt (TotalAmount) veya KDV hariç (ExcludingVatAmount) üzerinden tutarları üretir.
        /// Brüt verildiğinde: matrah yuvarlanır, KDV = brüt − matrah (kalıntı) böylece matrah + KDV her zaman brüte eşit olur.
        /// Hem brüt hem net gönderildiyse ve net×(1+KDV) ≈ brüt ise kullanıcı net tutarı korunur (tersine çevirme hatası önlenir).
        /// </summary>
        private static (decimal excludingVat, decimal vat, decimal total) CalculateAmountsFromRequest(decimal excludingVatAmount, decimal totalAmount, decimal vatRate)
        {
            var gross = Math.Round(totalAmount, 2, MidpointRounding.AwayFromZero);
            var netIn = Math.Round(excludingVatAmount, 2, MidpointRounding.AwayFromZero);

            if (gross > 0)
            {
                if (vatRate <= 0)
                    return (gross, 0m, gross);

                // Hem brüt hem net anlamlı gönderildiyse ve tutarlıysa net tutarı esas al (örn. 100 + %20 → 120)
                if (netIn > 0)
                {
                    var expectedGrossFromNet = Math.Round(netIn * (1m + vatRate / 100m), 2, MidpointRounding.AwayFromZero);
                    if (Math.Abs(gross - expectedGrossFromNet) <= 0.02m)
                    {
                        var vFromNet = Math.Round(gross - netIn, 2, MidpointRounding.AwayFromZero);
                        return (netIn, vFromNet, gross);
                    }
                }

                var divisor = 1m + (vatRate / 100m);
                var excluding = Math.Round(gross / divisor, 2, MidpointRounding.AwayFromZero);
                var vatResidual = gross - excluding;
                return (excluding, vatResidual, gross);
            }

            var (vatFromExcluding, totalFromExcluding) = CalculateAmounts(netIn, vatRate);
            return (netIn, vatFromExcluding, totalFromExcluding);
        }

        private static DateTime ParseInvoiceDate(string invoiceDate)
        {
            if (string.IsNullOrWhiteSpace(invoiceDate))
                throw new FormatException("invoiceDate is required");

            if (DateTime.TryParseExact(invoiceDate.Trim(), "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed))
                return parsed.Date;

            if (DateTime.TryParse(invoiceDate, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out parsed))
                return parsed.Date;

            throw new FormatException("Invalid invoiceDate format");
        }

        // request'te imageData data URL ise prefix kesilir, base64-only payload döner
        private static string? NormalizeImagePayload(string? imageData)
        {
            if (string.IsNullOrWhiteSpace(imageData))
                return null;

            var value = imageData.Trim();

            if (value.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
            {
                var commaIndex = value.IndexOf(',');
                if (commaIndex < 0 || commaIndex == value.Length - 1)
                    throw new FormatException("Invalid data URL");

                value = value[(commaIndex + 1)..].Trim();
            }

            // base64 doğrulaması
            _ = Convert.FromBase64String(value);
            return value;
        }

        /// <summary>Yemek masrafı için kabul edilen toplam tutar (vergi dahil) ve karşılanmayacak tutarı hesaplar. Limit vergi dahil toplam üzerinden uygulanır.</summary>
        private (decimal acceptedDailyAmount, decimal uncoveredAmount) GetMealAcceptedAndUncovered(int personCount, decimal totalAmount, decimal frontendAccepted, decimal frontendUncovered)
        {
            int perDay = 500;
            try
            {
                var settings = _expenseSettingsDal.Get(s => s.Id == 1);
                if (settings != null)
                    perDay = settings.MealAcceptedDailyAmount;
            }
            catch
            {
                // Tablo yok veya erişim hatası - varsayılan
            }

            var perDayM = (decimal)perDay;
            var people = (decimal)Math.Max(0, personCount);
            var acceptedRaw = perDayM * people;
            // Kabul edilen tutar, toplamı hiçbir durumda geçmemeli (UI'da "kabul edilen > toplam" hatasını engeller).
            var accepted = Math.Min(Math.Max(0m, acceptedRaw), Math.Max(0m, totalAmount));
            var uncovered = Math.Max(0m, totalAmount - accepted);

            if (frontendAccepted > 0 && Math.Abs(frontendAccepted - accepted) < 0.01m)
            {
                accepted = frontendAccepted;
            }

            if (frontendUncovered >= 0 && Math.Abs(frontendUncovered - uncovered) < 0.01m)
            {
                uncovered = frontendUncovered;
            }

            return (accepted, uncovered);
        }

        /// <summary>Listeler için: kullanıcı ve kalemleri tek seferde yükler (N+1 ve zaman aşımı önlenir).</summary>
        private List<ExpenseDto> MapExpensesToDtos(IReadOnlyList<Expense> expenses)
        {
            if (expenses.Count == 0) return new List<ExpenseDto>();

            var creatorIds = expenses.Select(e => e.CreatedUserId).Distinct().ToList();
            var users = _userDal.GetAll(u => creatorIds.Contains(u.Id));
            var userById = users.ToDictionary(u => u.Id);

            var expenseIds = expenses.Select(e => e.Id).ToList();
            var allItems = _expenseItemDal.GetAll(i => expenseIds.Contains(i.ExpenseId));
            var itemsByExpenseId = allItems.GroupBy(i => i.ExpenseId).ToDictionary(g => g.Key, g => g.ToList());

            return expenses.Select(e =>
            {
                userById.TryGetValue(e.CreatedUserId, out var creator);
                itemsByExpenseId.TryGetValue(e.Id, out var items);
                return ToDto(e, creator, items ?? new List<ExpenseItem>());
            }).ToList();
        }

        private ExpenseDto ToDto(Expense expense, User? creatorOverride = null, List<ExpenseItem>? itemsOverride = null)
        {
            if (expense == null) throw new ArgumentNullException(nameof(expense));
            // Kayıtlı tutarlar kaynak: yeniden hesap matrah×oran ile toplamı değiştirmesin (KDV dahil fatura tutarı ile uyum)
            var total = expense.TotalAmount > 0
                ? Math.Round(expense.TotalAmount, 2, MidpointRounding.AwayFromZero)
                : (expense.OriginalTotalAmount > 0
                    ? Math.Round(expense.OriginalTotalAmount, 2, MidpointRounding.AwayFromZero)
                    : 0m);
            var vat = Math.Round(expense.Vat, 2, MidpointRounding.AwayFromZero);
            if (total <= 0m && expense.ExcludingVatAmount > 0m)
            {
                var calc = CalculateAmounts(expense.ExcludingVatAmount, expense.VatRate);
                vat = calc.vat;
                total = calc.total;
            }

            var creator = creatorOverride ?? _userDal.Get(u => u.Id == expense.CreatedUserId);
            var items = itemsOverride ?? _expenseItemDal.GetAll(i => i.ExpenseId == expense.Id);

            var kkegTotal = Math.Round(items.Where(i => i.IsKkeg).Sum(i => i.TotalAmount), 2, MidpointRounding.AwayFromZero);
            var meal = IsMealExpense(expense.InvoiceTitle);
            var mealCalc = meal ? GetMealAcceptedAndUncovered(expense.PersonCount, total, expense.AcceptedDailyAmount, expense.UncoveredAmount) : (acceptedDailyAmount: 0m, uncoveredAmount: 0m);
            decimal refund;
            if (string.Equals(expense.Status, "Onaylandı", StringComparison.OrdinalIgnoreCase) && expense.ApprovedTotalAmount.HasValue)
            {
                refund = Math.Round(expense.ApprovedTotalAmount.Value, 2, MidpointRounding.AwayFromZero);
            }
            else
            {
                refund = Math.Round(Math.Max(0m, total - kkegTotal - mealCalc.uncoveredAmount), 2, MidpointRounding.AwayFromZero);
            }
            if (refund > total) refund = total;
            if (refund < 0m) refund = 0m;

            return new ExpenseDto
            {
                Id = expense.Id,
                RequestId = string.IsNullOrWhiteSpace(expense.RequestId) ? null : expense.RequestId,
                RequestDisplayCode8 = string.IsNullOrWhiteSpace(expense.RequestId)
                    ? null
                    : RequestDisplayCode.FormatRequestDisplayCode8(expense.RequestId),
                RefundAmount = refund,
                KkegTotalAmount = kkegTotal,
                UserId = expense.UserId,
                InvoiceNumber = expense.InvoiceNumber ?? "",
                InvoiceDate = expense.InvoiceDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                ProjectName = expense.ProjectName ?? "",
                InvoiceTitle = expense.InvoiceTitle ?? "",
                ExtraCategorie = expense.ExtraCategorie,
                IsKkeg = expense.IsKkeg,
                ApprovedTotalAmount = expense.ApprovedTotalAmount,
                OriginalTotalAmount = expense.OriginalTotalAmount > 0 ? expense.OriginalTotalAmount : total,
                HasKkeg = expense.HasKkeg,
                Items = items.Select(i => new ExpenseItemDto
                {
                    Id = i.Id,
                    ItemName = i.ItemName,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                    KdvRate = i.KdvRate,
                    TotalAmount = i.TotalAmount,
                    IsKkeg = i.IsKkeg
                }).ToList(),
                ExpenseType = expense.ExpenseType,
                Description = expense.Description ?? "",
                ExcludingVatAmount = Math.Round(expense.ExcludingVatAmount, 2, MidpointRounding.AwayFromZero),
                VatRate = expense.VatRate,
                Vat = vat,
                TotalAmount = total,
                Status = string.IsNullOrWhiteSpace(expense.Status) ? "Beklemede" : (expense.Status ?? "Beklemede"),
                IsPinned = expense.IsPinned,
                CreatedUserId = expense.CreatedUserId,
                CreatedUserName = creator?.Name,
                ApprovedUserId = expense.ApprovedUserId,
                PersonCount = expense.PersonCount,
                AcceptedDailyAmount = mealCalc.acceptedDailyAmount,
                UncoveredAmount = mealCalc.uncoveredAmount,
                MealPersonNames = expense.MealPersonNames,
                MealDescription = expense.MealDescription,
                ImageData = expense.ImageData == null ? null : Convert.ToBase64String(expense.ImageData),
                ImagePath = expense.ImagePath,
                // Liste response'unda her zaman YYYY-MM dönsün (eski kayıtlarda null olabiliyor)
                ExpensePeriod = string.IsNullOrWhiteSpace(expense.ExpensePeriod)
                    ? expense.InvoiceDate.ToString("yyyy-MM", CultureInfo.InvariantCulture)
                    : NormalizePeriod(expense.ExpensePeriod),
                RejectReason = expense.RejectReason,
                RevisionReason = expense.RevisionReason,
                CurrencyCode = string.IsNullOrWhiteSpace(expense.CurrencyCode) ? ExpenseCurrencyCodes.Default : ExpenseCurrencyCodes.Normalize(expense.CurrencyCode),
            };
        }

        private ExpenseDetailDto ToDetailDto(Expense expense)
        {
            var items = _expenseItemDal.GetAll(i => i.ExpenseId == expense.Id);
            var total = expense.TotalAmount > 0
                ? Math.Round(expense.TotalAmount, 2, MidpointRounding.AwayFromZero)
                : (expense.OriginalTotalAmount > 0 ? Math.Round(expense.OriginalTotalAmount, 2, MidpointRounding.AwayFromZero) : 0m);

            var kkegTotal = Math.Round(items.Where(i => i.IsKkeg).Sum(i => i.TotalAmount), 2, MidpointRounding.AwayFromZero);
            var meal = IsMealExpense(expense.InvoiceTitle);
            var mealCalc = meal ? GetMealAcceptedAndUncovered(expense.PersonCount, total, expense.AcceptedDailyAmount, expense.UncoveredAmount) : (acceptedDailyAmount: 0m, uncoveredAmount: 0m);
            decimal refund;
            if (string.Equals(expense.Status, "Onaylandı", StringComparison.OrdinalIgnoreCase) && expense.ApprovedTotalAmount.HasValue)
            {
                refund = Math.Round(expense.ApprovedTotalAmount.Value, 2, MidpointRounding.AwayFromZero);
            }
            else
            {
                refund = Math.Round(Math.Max(0m, total - kkegTotal - mealCalc.uncoveredAmount), 2, MidpointRounding.AwayFromZero);
            }
            if (refund > total) refund = total;
            if (refund < 0m) refund = 0m;

            return new ExpenseDetailDto
            {
                Id = expense.Id,
                RequestId = string.IsNullOrWhiteSpace(expense.RequestId) ? null : expense.RequestId,
                RequestDisplayCode8 = string.IsNullOrWhiteSpace(expense.RequestId)
                    ? null
                    : RequestDisplayCode.FormatRequestDisplayCode8(expense.RequestId),
                OriginalTotalAmount = expense.OriginalTotalAmount > 0 ? expense.OriginalTotalAmount : expense.TotalAmount,
                ApprovedTotalAmount = expense.ApprovedTotalAmount,
                HasKkeg = expense.HasKkeg,
                Status = string.IsNullOrWhiteSpace(expense.Status) ? "Beklemede" : expense.Status,
                RevisionReason = expense.RevisionReason,
                RejectReason = expense.RejectReason,
                CurrencyCode = string.IsNullOrWhiteSpace(expense.CurrencyCode) ? ExpenseCurrencyCodes.Default : ExpenseCurrencyCodes.Normalize(expense.CurrencyCode),
                AcceptedDailyAmount = mealCalc.acceptedDailyAmount,
                UncoveredAmount = mealCalc.uncoveredAmount,
                RefundAmount = refund,
                KkegTotalAmount = kkegTotal,
                Items = items.Select(i => new ExpenseItemDto
                {
                    Id = i.Id,
                    ItemName = i.ItemName,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                    KdvRate = i.KdvRate,
                    TotalAmount = i.TotalAmount,
                    IsKkeg = i.IsKkeg
                }).ToList()
            };
        }

        private static bool IsMealExpense(string? invoiceTitle)
        {
            if (string.IsNullOrWhiteSpace(invoiceTitle))
                return false;
            return invoiceTitle.Trim().Equals("Yemek", StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>Role kontrolünde tek bir karşılaştırma standardı kullanılır.</summary>
        private bool IsAdmin() =>
            string.Equals(_userContext.RoleName, RoleNames.Admin, StringComparison.OrdinalIgnoreCase);

        /// <summary>Masraf listelerinde ortak period/status/amount/search filtreleri.</summary>
        private IEnumerable<Expense> ApplyCommonExpenseFilters(
            IEnumerable<Expense> query,
            ExpenseFilterDto? filter,
            bool includeSearch)
        {
            if (!string.IsNullOrWhiteSpace(filter?.Period))
            {
                var period = NormalizePeriod(filter.Period);
                query = query.Where(e => (e.ExpensePeriod ?? "") == period);
            }

            if (!string.IsNullOrWhiteSpace(filter?.Status))
            {
                var status = filter.Status.Trim();
                query = query.Where(e => e.Status == status);
            }

            if (filter?.MinAmount.HasValue == true)
                query = query.Where(e => e.TotalAmount >= filter.MinAmount!.Value);

            if (filter?.MaxAmount.HasValue == true)
                query = query.Where(e => e.TotalAmount <= filter.MaxAmount!.Value);

            if (includeSearch && !string.IsNullOrWhiteSpace(filter?.Search))
            {
                var search = filter.Search.Trim().ToLowerInvariant();
                query = query.Where(e =>
                    (e.Description != null && e.Description.ToLower().Contains(search)) ||
                    (e.InvoiceNumber != null && e.InvoiceNumber.ToLower().Contains(search)) ||
                    (e.ProjectName != null && e.ProjectName.ToLower().Contains(search)));
            }

            return query;
        }

        private static string? NormalizeExpenseType(string? expenseType)
        {
            if (string.IsNullOrWhiteSpace(expenseType))
                return null;

            var s = expenseType.Trim();

            if (s.Equals("Nakit", StringComparison.OrdinalIgnoreCase))
                return "Nakit";

            if (s.Equals("Havale", StringComparison.OrdinalIgnoreCase))
                return "Havale";

            // TR karakter bazen "Kredi Karti" gibi gelebiliyor
            if (s.Equals("Kredi Kartı", StringComparison.OrdinalIgnoreCase) || s.Equals("Kredi Karti", StringComparison.OrdinalIgnoreCase))
                return "Kredi Kartı";

            return s; // Eğer eşleşmezse aynen döndür (zorunluluk kalktı)
        }

        private static string NormalizeStatus(string? status)
        {
            if (string.IsNullOrWhiteSpace(status))
                return "Beklemede";

            var s = status.Trim();

            if (s.Equals(StatusDraft, StringComparison.OrdinalIgnoreCase))
                return StatusDraft;

            if (s.Equals("Beklemede", StringComparison.OrdinalIgnoreCase))
                return "Beklemede";

            if (s.Equals("Onaylandı", StringComparison.OrdinalIgnoreCase) || s.Equals("Onaylandi", StringComparison.OrdinalIgnoreCase))
                return "Onaylandı";

            if (s.Equals("Onaylanmadı", StringComparison.OrdinalIgnoreCase) || s.Equals("Onaylanmadi", StringComparison.OrdinalIgnoreCase))
                return "Onaylanmadı";

            if (s.Equals("Revize Bekliyor", StringComparison.OrdinalIgnoreCase))
                return "Revize Bekliyor";

            if (s.Equals("Revize Edildi", StringComparison.OrdinalIgnoreCase))
                return "Revize Edildi";

            throw new FormatException("Invalid status");
        }

        private (bool allowed, string? message) ValidateDraftForSubmit(Expense draft)
        {
            if (draft == null) return (false, "Taslak bulunamadı.");
            if (!string.Equals(draft.Status, StatusDraft, StringComparison.OrdinalIgnoreCase))
                return (false, "Kayıt taslak değil.");

            if (string.IsNullOrWhiteSpace(draft.InvoiceNumber))
                return (false, "Fatura numarası zorunludur.");
            if (draft.InvoiceDate == default)
                return (false, "Fatura tarihi zorunludur.");
            if (string.IsNullOrWhiteSpace(draft.ProjectName))
                return (false, "Proje adı zorunludur.");
            if (string.IsNullOrWhiteSpace(draft.InvoiceTitle))
                return (false, "Kategori zorunludur.");
            if (string.IsNullOrWhiteSpace(draft.Description))
                return (false, "Açıklama zorunludur.");
            if (draft.Description.Length > 200)
                return (false, "Açıklama en fazla 200 karakter olabilir.");

            if (!ExpenseCurrencyCodes.IsAllowed(draft.CurrencyCode))
                return (false, "Geçersiz para birimi.");

            if (draft.ExcludingVatAmount < 0 || draft.TotalAmount < 0)
                return (false, "Tutarlar negatif olamaz.");
            if (draft.VatRate < 0 || draft.VatRate > 100)
                return (false, "KDV oranı 0-100 arasında olmalıdır.");

            var title = (draft.InvoiceTitle ?? "").Trim();
            if (string.Equals(title, "Yemek", StringComparison.OrdinalIgnoreCase)
                || string.Equals(title, "Ulaşım", StringComparison.OrdinalIgnoreCase))
            {
                if (draft.PersonCount <= 0)
                    return (false, "Kişi sayısı en az 1 olmalıdır.");
            }

            if (string.Equals(title, "Yemek", StringComparison.OrdinalIgnoreCase))
            {
                if (string.IsNullOrWhiteSpace(draft.MealPersonNames))
                    return (false, "Yemek masrafında katılımcı isimleri zorunludur.");
            }

            draft.ExpensePeriod = string.IsNullOrWhiteSpace(draft.ExpensePeriod)
                ? draft.InvoiceDate.ToString("yyyy-MM", CultureInfo.InvariantCulture)
                : NormalizePeriod(draft.ExpensePeriod);

            var (allowed, msg) = IsPeriodAllowedForAdd(draft.ExpensePeriod);
            if (!allowed)
                return (false, msg);

            return (true, null);
        }

        private static string NormalizePeriod(string? period)
        {
            if (string.IsNullOrWhiteSpace(period))
                return DateTime.Now.ToString("yyyy-MM", CultureInfo.InvariantCulture);
            var p = period.Trim();
            if (p.Length == 7 && p[4] == '-' && int.TryParse(p.AsSpan(0, 4), out var y) && int.TryParse(p.AsSpan(5, 2), out var m) && m >= 1 && m <= 12)
                return $"{y:D4}-{m:D2}";
            return DateTime.Now.ToString("yyyy-MM", CultureInfo.InvariantCulture);
        }

        /// <summary>
        /// Masraf sahibi kullanıcının müşteri ilişkisi yoksa, işlemi oluşturan kullanıcının aktif müşteri ilişkisini fallback olarak kullanır.
        /// Böylece herkes başkası adına masraf oluşturabilir.
        /// </summary>
        private (bool success, long customerId, string? message) ResolveCustomerIdForExpenseOwner(long ownerUserId, long creatorUserId)
        {
            var ownerUc = _userCustomerDal.Get(uc => uc.UserId == ownerUserId && uc.IsActive);
            if (ownerUc != null)
                return (true, ownerUc.CustomerId, null);

            var creatorUc = _userCustomerDal.Get(uc => uc.UserId == creatorUserId && uc.IsActive);
            if (creatorUc != null)
                return (true, creatorUc.CustomerId, null);

            return (false, 0, "Ne masraf sahibi ne de işlemi oluşturan kullanıcı için aktif müşteri ilişkisi bulunamadı.");
        }

        /// <summary>
        /// Önceki dönem son giriş günü (previousPeriodCutoffDay) ayarına göre dönem kontrolü.
        /// Cutoff=5 ise: Ayın 5'ine kadar önceki ay için masraf eklenebilir, sonrasında sadece cari ve ileri dönemler.
        /// </summary>
        private (bool allowed, string? message) IsPeriodAllowedForAdd(string period)
        {
            var now = DateTime.Now;
            var currentPeriod = now.ToString("yyyy-MM", CultureInfo.InvariantCulture);
            var previousPeriod = now.AddMonths(-1).ToString("yyyy-MM", CultureInfo.InvariantCulture);

            // Cari veya ileri dönem → her zaman izinli
            if (string.CompareOrdinal(period, currentPeriod) >= 0)
                return (true, null);

            // Önceki dönem → sadece bugünün günü <= cutoff ise izinli
            if (period == previousPeriod)
            {
                int cutoffDay = 5;
                try
                {
                    var settings = _expenseSettingsDal.Get(s => s.Id == 1);
                    if (settings != null)
                        cutoffDay = settings.PreviousPeriodCutoffDay;
                }
                catch { /* varsayılan 5 */ }
                if (now.Day <= cutoffDay)
                    return (true, null);
                return (false, $"Önceki dönem ({previousPeriod}) için masraf ekleme süresi doldu. Son giriş günü: {cutoffDay}.");
            }

            // Daha eski dönemler → izinsiz
            return (false, "Önceki dönemlere masraf eklenemez. Sadece cari ve ileri dönemler için ekleme yapılabilir.");
        }
    }
}
