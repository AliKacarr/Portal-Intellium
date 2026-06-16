using System;
using System.Diagnostics;
using System.IO;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using System.Text.Json;
using Business.Helpers;
using Business.Repository.ExpenseRepository;
using Entities.DTOs.ExpenseDto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace WebApi.Controllers
{
    /// <summary>
    /// Frontend: /api/expense (küçük harf). Route sabit api/expense olarak verildi.
    /// </summary>
    [Route("api/expense")]
    [ApiController]
    public class ExpenseController : ControllerBase
    {
        private readonly IExpenseService _expenseService;
        private readonly IWebHostEnvironment _env;
        private readonly IExpenseReminderRunner _expenseReminderRunner;
        private readonly IExpenseReceiptExtractionService _receiptExtraction;
        private readonly IConfiguration _configuration;
        private readonly ILogger<ExpenseController> _logger;

        public ExpenseController(
            IExpenseService expenseService,
            IWebHostEnvironment env,
            IExpenseReminderRunner expenseReminderRunner,
            IExpenseReceiptExtractionService receiptExtraction,
            IConfiguration configuration,
            ILogger<ExpenseController> logger)
        {
            _expenseService = expenseService;
            _env = env;
            _expenseReminderRunner = expenseReminderRunner;
            _receiptExtraction = receiptExtraction;
            _configuration = configuration;
            _logger = logger;
        }

        /// <summary>Masraf formu için seçilebilir para birimleri (ISO 4217). Tutarlar TL'ye çevrilmez; seçilen birimde saklanır.</summary>
        [HttpGet("currencies")]
        public IActionResult GetExpenseCurrencies()
        {
            var result = _expenseService.GetSupportedCurrencies();
            if (!result.Success)
                return BadRequest(result.Message);
            return Ok(new { data = result.Data });
        }

        /// <summary>Fiş/fatura fotoğrafından alan önerisi (Groq Cloud vision). JSON: imageBase64 | image_base64 | imageData; multipart: file|image|receipt. Bearer zorunlu. Başarıda: data + ocr_duration_ms (ms), header X-Ocr-Duration-Ms.</summary>
        /// <remarks>
        /// Aynı endpoint yeni masraf, &quot;Tamamlanmamış&quot; taslak (incomplete/upsert payload), revizyon düzenleme ve taslak snapshot ekranlarında kullanılmalıdır.
        /// OCR sonucu forma uygulama ve taslak kaydı (payload birleştirme) frontend sorumluluğundadır; backend taslak tablosunda yalnızca ham JSON saklar.
        /// </remarks>
        /// <summary>Alternatif yol: bazı frontend sürümleri <c>/api/external/receipt/extract</c> kullanır — aynı işleyici.</summary>
        [HttpPost("receipt/extract")]
        [HttpPost("/api/external/receipt/extract")]
        [Authorize]
        [Consumes("application/json", "multipart/form-data")]
        [RequestSizeLimit(25 * 1024 * 1024)]
        public async Task<IActionResult> ExtractReceipt([FromBody] ExpenseReceiptExtractRequestDto? body)
        {
            var maxBytes = _configuration.GetValue("GroqReceiptVision:MaxImageBytes", 15 * 1024 * 1024);
            byte[]? bytes = null;
            string? contentType = null;

            if (Request.ContentType?.StartsWith("multipart/form-data", StringComparison.OrdinalIgnoreCase) == true)
            {
                var form = await Request.ReadFormAsync();
                var file = form.Files.GetFile("file")
                    ?? form.Files.GetFile("image")
                    ?? form.Files.GetFile("receipt")
                    ?? form.Files.FirstOrDefault(f => f.Length > 0);
                if (file == null)
                {
                    _logger.LogWarning("receipt/extract 400: multipart dosya yok");
                    return BadRequest(ReceiptExtractError(
                        "Multipart: file, image veya receipt adında görüntü dosyası gönderin.",
                        "MISSING_MULTIPART_FILE"));
                }

                if (file.Length > maxBytes)
                {
                    _logger.LogWarning("receipt/extract 400: dosya çok büyük {Len} > {Max}", file.Length, maxBytes);
                    return BadRequest(ReceiptExtractError(
                        $"Görüntü çok büyük (çözülmüş üst sınır {maxBytes} byte).",
                        "IMAGE_TOO_LARGE"));
                }

                await using var ms = new MemoryStream();
                await file.CopyToAsync(ms);
                bytes = ms.ToArray();
                contentType = file.ContentType;
            }
            else
            {
                var dto = body ?? new ExpenseReceiptExtractRequestDto();
                var b64Raw = dto.ResolveImageBase64();
                if (string.IsNullOrWhiteSpace(b64Raw))
                {
                    _logger.LogWarning("receipt/extract 400: image alanı boş (JSON)");
                    return BadRequest(ReceiptExtractError(
                        "JSON: imageBase64, image_base64 veya imageData alanlarından biri dolu olmalı (veya data URL).",
                        "MISSING_IMAGE"));
                }

                bytes = TryDecodeImageBase64(b64Raw, out var mimeFromDataUrl);
                if (bytes == null || bytes.Length == 0)
                {
                    _logger.LogWarning("receipt/extract 400: base64 çözülemedi");
                    return BadRequest(ReceiptExtractError(
                        "Görüntü base64 geçersiz veya bozuk (data URL formatını kontrol edin).",
                        "INVALID_BASE64"));
                }

                if (bytes.Length > maxBytes)
                {
                    _logger.LogWarning("receipt/extract 400: çözülmüş görüntü çok büyük {Len}", bytes.Length);
                    return BadRequest(ReceiptExtractError(
                        $"Görüntü çok büyük (çözülmüş üst sınır {maxBytes} byte).",
                        "IMAGE_TOO_LARGE"));
                }

                var ct = dto.ResolveContentType();
                contentType = string.IsNullOrWhiteSpace(ct) ? mimeFromDataUrl : ct;
            }

            var sw = Stopwatch.StartNew();
            var result = await _receiptExtraction.ExtractAsync(bytes, contentType, HttpContext.RequestAborted);
            sw.Stop();
            var ocrMs = sw.ElapsedMilliseconds;
            if (!result.Success || result.Data == null)
            {
                var msg = result.Message ?? "Fiş okunamadı.";
                var code = MapReceiptExtractFailureCode(msg);
                _logger.LogWarning("receipt/extract 400: {Code} — {Message} ({Ms} ms)", code, msg, ocrMs);
                return BadRequest(ReceiptExtractError(msg, code));
            }

            Response.Headers.Append("X-Ocr-Duration-Ms", ocrMs.ToString());
            return Ok(new
            {
                data = MapReceiptExtractionToSnakeCase(result.Data),
                ocr_duration_ms = ocrMs
            });
        }

        /// <summary>Çoklu fiş: multipart files veya JSON images[]. Her öğe için ayrı çıkarma; kısmi hata destekli.</summary>
        [HttpPost("receipt/extract/bulk")]
        [Authorize]
        [Consumes("application/json", "multipart/form-data")]
        [RequestSizeLimit(80 * 1024 * 1024)]
        public async Task<IActionResult> ExtractReceiptBulk([FromBody] ExpenseReceiptExtractBulkRequestDto? body)
        {
            const int maxFiles = 20;
            var maxBytes = _configuration.GetValue("GroqReceiptVision:MaxImageBytes", 15 * 1024 * 1024);
            var list = new List<(int Index, byte[] Bytes, string? ContentType)>();

            if (Request.ContentType?.StartsWith("multipart/form-data", StringComparison.OrdinalIgnoreCase) == true)
            {
                var form = await Request.ReadFormAsync();
                var files = form.Files.Where(f => f.Length > 0).Take(maxFiles).ToList();
                if (files.Count == 0)
                    return BadRequest(new { message = "En az bir dosya gönderin." });
                for (var i = 0; i < files.Count; i++)
                {
                    var file = files[i];
                    if (file.Length > maxBytes)
                        return BadRequest(new { message = $"Dosya {i} çok büyük (max {maxBytes} byte)." });
                    await using var ms = new MemoryStream();
                    await file.CopyToAsync(ms);
                    list.Add((i, ms.ToArray(), file.ContentType));
                }
            }
            else
            {
                var imgs = body?.Images?.Where(x => x != null).Take(maxFiles).ToList() ?? new List<ExpenseReceiptExtractRequestDto>();
                if (imgs.Count == 0)
                    return BadRequest(new { message = "images dizisi boş olamaz." });
                for (var i = 0; i < imgs.Count; i++)
                {
                    var b = TryDecodeImageBase64(imgs[i].ResolveImageBase64(), out var mime);
                    if (b == null || b.Length == 0)
                        return BadRequest(new { message = $"images[{i}]: imageBase64 veya image_base64 geçersiz/boş." });
                    if (b.Length > maxBytes)
                        return BadRequest(new { message = $"images[{i}] çok büyük (max {maxBytes} byte)." });
                    var ct = imgs[i].ResolveContentType();
                    list.Add((i, b, string.IsNullOrWhiteSpace(ct) ? mime : ct));
                }
            }

            var results = new List<object>();
            foreach (var item in list)
            {
                var r = await _receiptExtraction.ExtractAsync(item.Bytes, item.ContentType, HttpContext.RequestAborted);
                if (r.Success && r.Data != null)
                {
                    results.Add(new
                    {
                        index = item.Index,
                        success = true,
                        extraction = MapReceiptExtractionToSnakeCase(r.Data)
                    });
                }
                else
                {
                    results.Add(new
                    {
                        index = item.Index,
                        success = false,
                        message = r.Message ?? "Fiş okunamadı."
                    });
                }
            }

            return Ok(new { data = new { results } });
        }

        /// <summary>400 yanıt gövdesi: message + code + errors (frontend uyumu).</summary>
        private static object ReceiptExtractError(string message, string code) =>
            new { message, code, errors = Array.Empty<string>() };

        /// <summary>Fiş OCR (Groq) hatalarında makine tarafı kodu.</summary>
        private static string MapReceiptExtractFailureCode(string msg)
        {
            if (string.IsNullOrWhiteSpace(msg)) return "RECEIPT_AI_FAILED";
            if (msg.Contains("ApiKey", StringComparison.OrdinalIgnoreCase) ||
                msg.Contains("yapılandırılmadı", StringComparison.OrdinalIgnoreCase))
                return "RECEIPT_AI_NOT_CONFIGURED";
            if (msg.Contains("429", StringComparison.Ordinal) ||
                msg.Contains("kota", StringComparison.OrdinalIgnoreCase) ||
                msg.Contains("quota", StringComparison.OrdinalIgnoreCase) ||
                msg.Contains("RESOURCE_EXHAUSTED", StringComparison.OrdinalIgnoreCase) ||
                msg.Contains("exceeded your current quota", StringComparison.OrdinalIgnoreCase) ||
                msg.Contains("rate limit", StringComparison.OrdinalIgnoreCase) ||
                msg.Contains("Too Many Requests", StringComparison.OrdinalIgnoreCase) ||
                msg.Contains("istek kotası", StringComparison.OrdinalIgnoreCase))
                return "RECEIPT_AI_QUOTA";
            if (msg.Contains("Görüntü verisi boş", StringComparison.OrdinalIgnoreCase))
                return "EMPTY_IMAGE";
            if (msg.Contains("bağlanılamadı", StringComparison.OrdinalIgnoreCase))
                return "RECEIPT_AI_UPSTREAM";
            if (msg.Contains("hata döndü", StringComparison.OrdinalIgnoreCase) ||
                msg.Contains("API hata", StringComparison.OrdinalIgnoreCase))
                return "RECEIPT_AI_UPSTREAM";
            if (msg.Contains("token sınırında", StringComparison.OrdinalIgnoreCase) ||
                msg.Contains("MaxOutputTokens", StringComparison.OrdinalIgnoreCase) ||
                msg.Contains("MaxTokens", StringComparison.OrdinalIgnoreCase))
                return "RECEIPT_AI_MAX_TOKENS";
            if (msg.Contains("JSON olarak okunamadı", StringComparison.OrdinalIgnoreCase) ||
                msg.Contains("yanıtı işlenemedi", StringComparison.OrdinalIgnoreCase) ||
                msg.Contains("JSON parse", StringComparison.OrdinalIgnoreCase))
                return "RECEIPT_AI_PARSE";
            if (msg.Contains("boş yanıt", StringComparison.OrdinalIgnoreCase))
                return "RECEIPT_AI_EMPTY_MODEL";
            return "RECEIPT_AI_FAILED";
        }

        private static object MapReceiptExtractionToSnakeCase(ExpenseReceiptExtractionResultDto d)
        {
            return new
            {
                invoice_number = d.InvoiceNumber,
                invoice_date = d.InvoiceDate,
                invoice_title = d.InvoiceTitle,
                currency_code = d.CurrencyCode,
                description = d.Description,
                items = (d.Items ?? new List<ExpenseReceiptExtractedItemDto>()).Select(i => new
                {
                    item_name = i.ItemName,
                    quantity = i.Quantity,
                    unit_price = i.UnitPrice,
                    kdv_rate = i.KdvRate
                }).ToList(),
                total_amount = d.TotalAmount,
                vat = d.Vat,
                excluding_vat_amount = d.ExcludingVatAmount,
                vat_rate = d.VatRate
            };
        }

        private static byte[]? TryDecodeImageBase64(string? raw, out string? mimeFromDataUrl)
        {
            mimeFromDataUrl = null;
            if (string.IsNullOrWhiteSpace(raw)) return null;
            var s = raw.Trim();
            if (s.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
            {
                var comma = s.IndexOf(',');
                if (comma <= 0) return null;
                var header = s[..comma];
                var semi = header.IndexOf(';', StringComparison.Ordinal);
                var colon = header.IndexOf(':');
                if (colon >= 0 && semi > colon)
                    mimeFromDataUrl = header[(colon + 1)..semi];
                var b64 = NormalizeBase64Payload(s[(comma + 1)..]);
                try
                {
                    return Convert.FromBase64String(b64);
                }
                catch
                {
                    return null;
                }
            }

            try
            {
                return Convert.FromBase64String(NormalizeBase64Payload(s));
            }
            catch
            {
                return null;
            }
        }

        /// <summary>PEM/çok satırlı base64 ve gereksiz boşlukları kaldırır.</summary>
        private static string NormalizeBase64Payload(string raw)
        {
            if (string.IsNullOrEmpty(raw)) return raw;
            var sb = new System.Text.StringBuilder(raw.Length);
            foreach (var c in raw)
            {
                if (c is '\r' or '\n' or ' ' or '\t') continue;
                sb.Append(c);
            }

            return sb.ToString();
        }

        /// <summary>Manuel test: hatırlatma job (simulateNow / dryRun / period / ignoreScheduleRules). Quartz ignoreScheduleRules kullanmaz. Sadece admin.</summary>
        [HttpPost("reminders/run")]
        public async Task<IActionResult> RunExpenseReminders([FromBody] RunExpenseRemindersDto? dto)
        {
            var result = await _expenseReminderRunner.RunAsync(dto ?? new RunExpenseRemindersDto());
            if (!result.Success)
                return BadRequest(new { message = result.Message });
            return Ok(new { data = result.Data, message = result.Message });
        }

        // Not: "send-now" endpoint'i bilinçli olarak kaldırıldı.
        // İstek: Bildirimler sadece Quartz ile Pazartesi 10:25'te üretilmeli.

        /// <summary>Neden bildirim/mail yok — zaman kuralı, hedef admin listesi, mail ayarı. Sadece admin.</summary>
        [HttpGet("reminders/diagnostics")]
        public async Task<IActionResult> GetExpenseReminderDiagnostics()
        {
            var result = await _expenseReminderRunner.GetDiagnosticsAsync();
            if (!result.Success)
                return BadRequest(new { message = result.Message });
            return Ok(new { data = result.Data, message = result.Message });
        }

        /// <summary>SMTP doğrulama: masraf mailleriyle aynı ayarlarla tek test e-postası. Sadece admin. Örnek: <c>POST .../reminders/test-mail?to=admin@gmail.com</c></summary>
        [HttpPost("reminders/test-mail")]
        public async Task<IActionResult> SendExpenseReminderTestMail([FromQuery] string to)
        {
            var result = await _expenseReminderRunner.SendTestMailAsync(to ?? string.Empty);
            if (!result.Success)
                return BadRequest(new { message = result.Message });
            return Ok(new { data = result.Data, message = result.Message });
        }

        [HttpPost("add")]
        public IActionResult Add([FromBody] AddExpenseDto expenseDto)
        {
            var result = _expenseService.Add(expenseDto);
            if (result.Success)
                return Ok(result.Data);
            return BadRequest(new { message = result.Message ?? "Masraf eklenemedi.", errors = Array.Empty<string>() });
        }

        /// <summary>
        /// Taslak kaydet. JSON veya multipart/form-data destekler.
        /// multipart için: "draft" = JSON string, "file" = tek dosya (opsiyonel).
        /// </summary>
        [HttpPost("draft")]
        [Consumes("application/json", "multipart/form-data")]
        public async Task<IActionResult> AddDraft()
        {
            UpsertExpenseDraftDto? draft = null;

            if (Request.ContentType?.StartsWith("multipart/form-data", StringComparison.OrdinalIgnoreCase) == true)
            {
                var form = await Request.ReadFormAsync();
                var json = form["draft"].ToString();
                if (string.IsNullOrWhiteSpace(json))
                    json = form["expense"].ToString();
                if (string.IsNullOrWhiteSpace(json))
                    return BadRequest("draft (JSON) alanı gereklidir.");
                try
                {
                    draft = JsonSerializer.Deserialize<UpsertExpenseDraftDto>(json);
                }
                catch (JsonException)
                {
                    return BadRequest("draft geçerli bir JSON olmalıdır.");
                }

                var file = form.Files?.FirstOrDefault();
                if (file != null && file.Length > 0)
                {
                    var uploadDir = Path.Combine(_env.WebRootPath ?? _env.ContentRootPath ?? "wwwroot", "uploads", "expenses");
                    Directory.CreateDirectory(uploadDir);
                    var ext = Path.GetExtension(file.FileName);
                    if (string.IsNullOrEmpty(ext)) ext = ".bin";
                    var fileName = $"{Guid.NewGuid():N}{ext}";
                    var fullPath = Path.Combine(uploadDir, fileName);
                    await using (var stream = new FileStream(fullPath, FileMode.Create))
                        await file.CopyToAsync(stream);
                    draft ??= new UpsertExpenseDraftDto();
                    draft.ImagePath = "/uploads/expenses/" + fileName;
                }
            }
            else
            {
                try
                {
                    draft = await JsonSerializer.DeserializeAsync<UpsertExpenseDraftDto>(Request.Body);
                }
                catch (JsonException)
                {
                    return BadRequest("Geçerli JSON body gönderin.");
                }
            }

            if (draft == null)
                return BadRequest("Taslak body boş olamaz.");

            var result = _expenseService.AddDraft(draft);
            if (result.Success)
                return Ok(new { data = result.Data, message = result.Message });
            return BadRequest(new { message = result.Message ?? "Taslak kaydedilemedi." });
        }

        /// <summary>
        /// Çoklu taslak kaydet. JSON veya multipart/form-data destekler.
        /// JSON: { "expenses": [ ... ] }
        /// multipart: "drafts" veya "expenses" = JSON string, "files" = dosyalar (sıra ile).
        /// </summary>
        [HttpPost("draft/bulk")]
        [Consumes("application/json", "multipart/form-data")]
        public async Task<IActionResult> BulkDraft()
        {
            BulkInsertExpenseDraftRequestDto? request = null;
            IReadOnlyList<string>? imagePathsByIndex = null;

            if (Request.ContentType?.StartsWith("multipart/form-data", StringComparison.OrdinalIgnoreCase) == true)
            {
                var form = await Request.ReadFormAsync();
                var json = form["drafts"].ToString();
                if (string.IsNullOrWhiteSpace(json))
                    json = form["expenses"].ToString();
                if (string.IsNullOrWhiteSpace(json))
                    return BadRequest("drafts/expenses (JSON) alanı gereklidir.");
                try
                {
                    request = JsonSerializer.Deserialize<BulkInsertExpenseDraftRequestDto>(json);
                }
                catch (JsonException)
                {
                    return BadRequest("Taslak listesi geçerli bir JSON olmalıdır.");
                }

                var files = form.Files;
                if (files != null && files.Count > 0)
                {
                    var uploadDir = Path.Combine(_env.WebRootPath ?? _env.ContentRootPath ?? "wwwroot", "uploads", "expenses");
                    Directory.CreateDirectory(uploadDir);
                    var paths = new List<string>();
                    for (var i = 0; i < files.Count; i++)
                    {
                        var file = files[i];
                        var ext = Path.GetExtension(file.FileName);
                        if (string.IsNullOrEmpty(ext)) ext = ".bin";
                        var fileName = $"{Guid.NewGuid():N}{ext}";
                        var fullPath = Path.Combine(uploadDir, fileName);
                        await using (var stream = new FileStream(fullPath, FileMode.Create))
                            await file.CopyToAsync(stream);
                        paths.Add("/uploads/expenses/" + fileName);
                    }
                    imagePathsByIndex = paths;
                }
            }
            else
            {
                try
                {
                    request = await JsonSerializer.DeserializeAsync<BulkInsertExpenseDraftRequestDto>(Request.Body);
                }
                catch (JsonException)
                {
                    return BadRequest("Geçerli JSON body gönderin: { \"expenses\": [ ... ] }");
                }
            }

            if (request == null || request.Expenses == null || request.Expenses.Count == 0)
                return BadRequest("En az bir taslak gönderilmelidir.");

            var result = _expenseService.BulkInsertDraft(request, imagePathsByIndex);
            if (result.Success)
                return Ok(new { data = result.Data, message = result.Message });
            return BadRequest(new { message = result.Message ?? "Taslaklar kaydedilemedi." });
        }

        /// <summary>Kullanıcının taslaklarını döner.</summary>
        [HttpGet("my-drafts")]
        public IActionResult MyDrafts()
        {
            var result = _expenseService.GetMyDrafts();
            if (result.Success)
                return Ok(new { data = result.Data });
            return BadRequest(new { message = result.Message });
        }

        /// <summary>Taslak güncelle (partial).</summary>
        [HttpPut("draft/{draftId:int}")]
        public IActionResult UpdateDraft(int draftId, [FromBody] UpsertExpenseDraftDto dto)
        {
            var result = _expenseService.UpdateDraft(draftId, dto);
            if (result.Success)
                return Ok(new { data = result.Data, message = result.Message });
            return BadRequest(new { message = result.Message ?? "Taslak güncellenemedi." });
        }

        /// <summary>
        /// Taslak sil: <paramref name="draftKey"/> tam sayı ise Expenses taslağı (Id), GUID ise uuid snapshot (<c>expense_drafts</c>).
        /// Eski frontend'ler <c>DELETE .../draft/{{uuid}}</c> ile çağırmaya devam edebilir (ayrı route gerektirmez).
        /// </summary>
        [HttpDelete("draft/{draftKey}")]
        public IActionResult DeleteDraftOrSnapshot([FromRoute] string draftKey)
        {
            if (string.IsNullOrWhiteSpace(draftKey))
                return BadRequest(new { message = "Geçersiz taslak." });

            var key = NormalizeExpenseDraftRouteKey(draftKey);
            if (string.IsNullOrWhiteSpace(key))
                return BadRequest(new { message = "Geçersiz taslak." });

            if (Guid.TryParse(key, out var uuid) && uuid != Guid.Empty)
            {
                if (User?.Identity?.IsAuthenticated != true)
                    return Unauthorized(new { message = "Yetkilendirme gerekli." });

                var snap = _expenseService.DeleteDraftSnapshot(key);
                if (snap.Success)
                    return Ok(new { success = true, message = snap.Message });
                return BadRequest(new { success = false, message = snap.Message });
            }

            if (int.TryParse(key, NumberStyles.Integer, CultureInfo.InvariantCulture, out var expenseDraftId)
                && expenseDraftId > 0)
            {
                var result = _expenseService.DeleteDraft(expenseDraftId);
                if (result.Success)
                    return Ok(new { success = true, message = result.Message });
                return BadRequest(new { message = result.Message });
            }

            return BadRequest(new { message = "Geçersiz taslak kimliği (pozitif tam sayı veya GUID)." });
        }

        // --- DB Taslak Snapshot (uuid) ---

        [HttpPost("draft/upsert")]
        [Authorize]
        public IActionResult UpsertDraftSnapshot([FromBody] UpsertExpenseDraftSnapshotRequestDto dto)
        {
            var result = _expenseService.UpsertDraftSnapshot(dto);
            if (result.Success && result.Data != null)
                return Ok(new { draftId = result.Data.DraftId, data = new { draftId = result.Data.DraftId } });
            return BadRequest(new { message = result.Message ?? "Kaydedilemedi." });
        }

        [HttpGet("draft/my")]
        [Authorize]
        public IActionResult GetMyDraftSnapshots()
        {
            var result = _expenseService.GetMyDraftSnapshots();
            if (!result.Success)
                return BadRequest(new { message = result.Message });

            var items = (result.Data ?? new List<ExpenseDraftSnapshotDto>())
                .Select(x => new { id = x.Id, payload_json = x.PayloadJson, created_at = x.CreatedAt, updated_at = x.UpdatedAt })
                .ToList();

            return Ok(new { items, data = new { items } });
        }

        [HttpGet("draft/snapshot/{draftId:guid}")]
        [Authorize]
        public IActionResult GetDraftSnapshotById(string draftId)
        {
            var result = _expenseService.GetMyDraftSnapshotById(draftId);
            if (!result.Success || result.Data == null)
                return NotFound(new { message = result.Message ?? "Kayıt bulunamadı." });

            return Ok(new { id = result.Data.Id, payload_json = result.Data.PayloadJson, created_at = result.Data.CreatedAt, updated_at = result.Data.UpdatedAt });
        }

        /// <summary>RequestId bazlı taslak sil.</summary>
        [HttpDelete("draft/request/{requestId}")]
        public IActionResult DeleteDraftByRequest(string requestId)
        {
            var result = _expenseService.DeleteDraftByRequest(requestId);
            if (result.Success)
                return Ok(new { success = true, message = result.Message });
            return BadRequest(new { message = result.Message });
        }

        /// <summary>Taslağı gönder (Beklemede'ye çevirir).</summary>
        [HttpPost("draft/{draftId:int}/submit")]
        public IActionResult SubmitDraft(int draftId, [FromBody] SubmitExpenseDraftDto? _)
        {
            var result = _expenseService.SubmitDraft(draftId);
            if (result.Success)
                return Ok(new { data = result.Data, message = result.Message });
            return BadRequest(new { message = result.Message ?? "Taslak gönderilemedi." });
        }

        /// <summary>RequestId bazlı taslakları gönder (Beklemede'ye çevirir).</summary>
        [HttpPost("draft/request/{requestId}/submit")]
        public IActionResult SubmitDraftRequest(string requestId, [FromBody] SubmitExpenseDraftDto? _)
        {
            var result = _expenseService.SubmitDraftRequest(requestId);
            if (result.Success)
                return Ok(new { data = result.Data, message = result.Message });
            return BadRequest(new { message = result.Message ?? "Taslaklar gönderilemedi." });
        }

        // --- Tamamlanmamış Masraf (Incomplete Draft) ---
        // payload (expenses[], items, tutarlar, imageData vb.) jsonb'de ham saklanır; GET incomplete/{id} ve incomplete/my aynı payload_json'u döner (liste özet değildir).
        // Gövde üst sınırı: Kestrel + RequestSizeLimit; ayrıca ExpenseIncompleteDraft:MaxPayloadBytes ile uygulama kontrolü.

        [HttpPost("incomplete/upsert")]
        [RequestSizeLimit(26 * 1024 * 1024)]
        [Authorize]
        public IActionResult UpsertIncomplete([FromBody] UpsertExpenseIncompleteDraftRequestDto dto)
        {
            var result = _expenseService.UpsertIncompleteDraft(dto);
            if (result.Success && result.Data != null)
                return Ok(new { data = new { draftId = result.Data.DraftId }, draftId = result.Data.DraftId });
            return BadRequest(new { message = result.Message ?? "Kaydedilemedi." });
        }

        [HttpDelete("incomplete/{draftId}")]
        [Authorize]
        public IActionResult DeleteIncomplete(string draftId)
        {
            var result = _expenseService.DeleteIncompleteDraft(draftId);
            if (result.Success)
                return Ok(new { success = true, message = result.Message });
            return BadRequest(new { success = false, message = result.Message });
        }

        [HttpGet("incomplete/{draftId}")]
        [Authorize]
        public IActionResult GetIncompleteById(string draftId)
        {
            var result = _expenseService.GetMyIncompleteDraftById(draftId);
            if (!result.Success || result.Data == null)
                return NotFound(new { message = result.Message ?? "Kayıt bulunamadı." });

            // İstenen response shape: { id, payload_json, created_at, updated_at }
            return Ok(new
            {
                id = result.Data.Id,
                payload_json = result.Data.PayloadJson,
                created_at = result.Data.CreatedAt,
                updated_at = result.Data.UpdatedAt
            });
        }

        [HttpGet("incomplete/my")]
        [Authorize]
        public IActionResult GetMyIncomplete()
        {
            var result = _expenseService.GetMyIncompleteDrafts();
            if (result.Success)
            {
                var items = (result.Data ?? new List<ExpenseIncompleteDraftDto>())
                    .Select(x => new
                    {
                        id = x.Id,
                        payload_json = x.PayloadJson,
                        created_at = x.CreatedAt,
                        updated_at = x.UpdatedAt
                    })
                    .ToList();

                // Tercih edilen format: { items: [...] } — ama geriye dönük uyumluluk için data.items da veriyoruz.
                return Ok(new { items, data = new { items } });
            }
            return BadRequest(new { message = result.Message });
        }

        /// <summary>Çoklu masraf ekleme. Her kayıt için dönem kuralı ve başka kullanıcı adına (admin) geçerlidir.</summary>
        [HttpPost("bulkAdd")]
        public IActionResult BulkAdd([FromBody] BulkAddExpenseDto bulkDto)
        {
            var result = _expenseService.BulkAdd(bulkDto);
            if (result.Success)
            {
                return Ok(new { data = result.Data, message = result.Message });
            }
            return BadRequest(result.Message);
        }

        /// <summary>
        /// Çoklu kayıt (bulk insert): gelen dizideki her masraf ayrı satır olarak kaydedilir.
        /// createdBy = isteği atan kullanıcı, status = "Beklemede". Admin tek tek onaylayıp reddedebilir.
        /// İstek: application/json body = { "expenses": [ ... ] } VEYA multipart/form-data: "expenses" = JSON string, "files" = dosyalar (sıra = ImageFileIndex).
        /// </summary>
        [HttpPost("bulk")]
        [Consumes("application/json", "multipart/form-data")]
        public async Task<IActionResult> Bulk()
        {
            BulkInsertExpenseRequestDto? request = null;
            IReadOnlyList<string>? imagePathsByIndex = null;

            if (Request.ContentType?.StartsWith("multipart/form-data", StringComparison.OrdinalIgnoreCase) == true)
            {
                var form = await Request.ReadFormAsync();
                var expensesJson = form["expenses"].ToString();
                if (string.IsNullOrWhiteSpace(expensesJson))
                {
                    return BadRequest("expenses (JSON) alanı gereklidir.");
                }
                try
                {
                    request = JsonSerializer.Deserialize<BulkInsertExpenseRequestDto>(expensesJson);
                }
                catch (JsonException)
                {
                    return BadRequest("expenses geçerli bir JSON dizisi olmalıdır.");
                }
                var files = form.Files;
                if (files != null && files.Count > 0)
                {
                    var uploadDir = Path.Combine(_env.WebRootPath ?? _env.ContentRootPath ?? "wwwroot", "uploads", "expenses");
                    Directory.CreateDirectory(uploadDir);
                    var paths = new List<string>();
                    for (var i = 0; i < files.Count; i++)
                    {
                        var file = files[i];
                        var ext = Path.GetExtension(file.FileName);
                        if (string.IsNullOrEmpty(ext)) ext = ".bin";
                        var fileName = $"{Guid.NewGuid():N}{ext}";
                        var fullPath = Path.Combine(uploadDir, fileName);
                        await using (var stream = new FileStream(fullPath, FileMode.Create))
                            await file.CopyToAsync(stream);
                        paths.Add("/uploads/expenses/" + fileName);
                    }
                    imagePathsByIndex = paths;
                }
            }
            else
            {
                try
                {
                    request = await JsonSerializer.DeserializeAsync<BulkInsertExpenseRequestDto>(Request.Body);
                }
                catch (JsonException)
                {
                    return BadRequest("Geçerli JSON body gönderin: { \"expenses\": [ ... ] }");
                }
            }

            if (request == null || request.Expenses == null || request.Expenses.Count == 0)
            {
                return BadRequest("En az bir masraf gönderilmelidir.");
            }

            var result = _expenseService.BulkInsert(request, imagePathsByIndex);
            if (result.Success)
            {
                return Ok(new { data = result.Data, message = result.Message });
            }
            return BadRequest(result.Message);
        }

        [HttpPut("update/{id}")]
        public IActionResult Update(int id, [FromBody] UpdateExpenseDto expenseDto)
        {
            if (expenseDto.Id != 0 && expenseDto.Id != id)
            {
                return BadRequest("Path id ile body id tutarlı olmalı.");
            }

            expenseDto.Id = id;
            var result = _expenseService.Update(expenseDto);
            if (result.Success)
                return Ok(result.Data);
            return BadRequest(new { message = result.Message });
        }

        [HttpDelete("delete/{id}")]
        public IActionResult Delete(int id)
        {
            var result = _expenseService.Delete(id);
            if (result.Success)
            {
                return Ok(new { success = true, message = result.Message });
            }
            return BadRequest(result.Message);
        }

        /// <summary>
        /// GET /api/expense/getAllByUserId?userId={userId} — Sadece bu userId'ye ait masraflar döner.
        /// Response: { "data": [ ... ] } (Seçenek A)
        /// </summary>
        [HttpGet("getAllByUserId")]
        public IActionResult GetAllByUserId([FromQuery(Name = "userId")] long userId)
        {
            var result = _expenseService.GetAllByUserId(userId);
            if (result.Success)
            {
                return Ok(new { data = result.Data });
            }
            return BadRequest(result.Message);
        }

        [HttpGet("getById")]
        public IActionResult GetById(int id)
        {
            var result = _expenseService.GetById(id);
            if (result.Success)
            {
                return Ok(result.Data);
            }
            return BadRequest(new { message = result.Message ?? "Masraf detayı alınamadı.", errors = Array.Empty<string>() });
        }

        [HttpGet("getById/{id}")]
        public IActionResult GetByIdRoute(int id)
        {
            var result = _expenseService.GetDetailById(id);
            if (result.Success)
                return Ok(result.Data);
            return BadRequest(new { message = result.Message ?? "Masraf detayı alınamadı.", errors = Array.Empty<string>() });
        }

        /// <summary>Masraf paneli / Masraflarım. userId, period, status vb. ExpenseFilterDto ile gönderilebilir. Admin: belirli çalışan için userId=...; tüm şirket listesi için getAllForAdmin kullanın. Export ile aynı filtre parametrelerini kullanın.</summary>
        [HttpGet("my-expenses")]
        public IActionResult MyExpenses([FromQuery] ExpenseFilterDto filter)
        {
            var f = filter ?? new ExpenseFilterDto();
            if (f.PinnedFirst.HasValue)
                f.SortByPinnedFirst = f.PinnedFirst.Value;
            var result = _expenseService.GetFiltered(f);
            if (result.Success)
                return Ok(new { data = result.Data });
            return BadRequest(result.Message);
        }

        /// <summary>Filtreli listeleme. Admin: belirli kullanıcı userId; yalnızca kendi kayıtları varsayılan (IncludeAllUsers=true ile tümü — tercihen getAllForAdmin). User/worker: sadece kendi kayıtları.</summary>
        [HttpGet("getFiltered")]
        public IActionResult GetFiltered([FromQuery] ExpenseFilterDto filter)
        {
            var result = _expenseService.GetFiltered(filter ?? new ExpenseFilterDto());
            if (result.Success)
            {
                return Ok(new { data = result.Data });
            }
            return BadRequest(result.Message);
        }

        /// <summary>Admin: Tüm kullanıcıların masraflarını döner. Admin paneli bu endpoint'i kullanmalı (onaylama/red için tüm liste).</summary>
        [HttpGet("getAllForAdmin")]
        public IActionResult GetAllForAdmin([FromQuery] ExpenseFilterDto filter)
        {
            var result = _expenseService.GetAllForAdmin(filter ?? new ExpenseFilterDto());
            if (result.Success)
                return Ok(new { data = result.Data });
            return BadRequest(result.Message);
        }

        /// <summary>Admin: Masrafı onayla.</summary>
        [HttpPut("approve")]
        public IActionResult Approve([FromBody] Entities.DTOs.ExpenseDto.ApproveExpenseDto dto)
        {
            var result = _expenseService.Approve(dto);
            if (result.Success)
                return Ok(result.Data);
            return BadRequest(new { message = result.Message ?? "Masraf onaylanamadı.", errors = Array.Empty<string>() });
        }

        // Geriye dönük uyumluluk: body göndermeyen eski çağrılar için
        [HttpPut("approve/{id}")]
        public IActionResult ApproveLegacy(int id)
        {
            var result = _expenseService.Approve(new Entities.DTOs.ExpenseDto.ApproveExpenseDto
            {
                ExpenseId = id,
                KkegItemIds = new List<int>()
            });
            if (result.Success)
                return Ok(result.Data);
            return BadRequest(new { message = result.Message ?? "Masraf onaylanamadı.", errors = Array.Empty<string>() });
        }

        /// <summary>Admin: Masrafı reddet.</summary>
        [HttpPut("reject/{id}")]
        public IActionResult Reject(int id)
        {
            var result = _expenseService.Reject(id);
            if (result.Success)
                return Ok(new { success = true, message = result.Message });
            return BadRequest(result.Message);
        }

        /// <summary>Tek çağrı ile request bazlı onay.</summary>
        [HttpPut("request/{requestId}/approve")]
        public IActionResult ApproveRequest(string requestId, [FromBody] Entities.DTOs.ExpenseDto.ApproveExpenseRequestDto dto)
        {
            var result = _expenseService.ApproveRequest(requestId, dto);
            if (result.Success)
                return Ok(new { data = result.Data, message = result.Message });
            return BadRequest(new { message = result.Message ?? "Talep onaylanamadı." });
        }

        /// <summary>Tek çağrı ile request bazlı red.</summary>
        [HttpPut("request/{requestId}/reject")]
        public IActionResult RejectRequest(string requestId, [FromBody] Entities.DTOs.ExpenseDto.RejectExpenseRequestDto dto)
        {
            var result = _expenseService.RejectRequest(requestId, dto);
            if (result.Success)
                return Ok(new { success = true, message = result.Message });
            return BadRequest(new { message = result.Message ?? "Talep reddedilemedi." });
        }

        /// <summary>Tek çağrı ile request bazlı revize talebi (tüm kalemler Revize Bekliyor + revisionReason).</summary>
        [HttpPut("request/{requestId}/revision")]
        public IActionResult RevisionRequest(string requestId, [FromBody] RevisionExpenseRequestDto dto)
        {
            var result = _expenseService.RevisionRequest(requestId, dto);
            if (result.Success)
                return Ok(new { data = result.Data, message = result.Message });
            if (string.Equals(result.Message, "Talep bulunamadı.", StringComparison.Ordinal))
                return NotFound(new { message = result.Message });
            return BadRequest(new { message = result.Message ?? "Revize talebi oluşturulamadı." });
        }

        /// <summary>En üste sabitle / sabitlemeyi kaldır (toggle).</summary>
        [HttpPut("pin/{id}")]
        public IActionResult TogglePin(int id)
        {
            var result = _expenseService.TogglePin(id);
            if (result.Success)
                return Ok(result.Data);
            return BadRequest(result.Message);
        }

        /// <summary>Excel indir. Admin: ekrandaki liste ile aynı sorguyu gönderin (örn. userId=çalışanId). userId yok ve includeAllUsers yoksa sadece giriş yapan admin'in kayıtları. Tüm şirket: includeAllUsers=true (veya getAllForAdmin + ayrı export ihtiyacı).</summary>
        [HttpGet("exportToExcel")]
        public IActionResult ExportToExcel([FromQuery] ExpenseFilterDto filter)
        {
            var result = _expenseService.ExportToExcel(filter ?? new ExpenseFilterDto());
            if (!result.Success)
                return BadRequest(result.Message);
            if (result.Data == null || result.Data.Length == 0)
                return BadRequest("Excel verisi oluşturulamadı.");
            return File(result.Data, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Masraflar.xlsx");
        }

        /// <summary>PDF indir. Filtre kuralları exportToExcel ile aynı (admin için userId / includeAllUsers).</summary>
        [HttpGet("exportToPdf")]
        public IActionResult ExportToPdf([FromQuery] ExpenseFilterDto filter)
        {
            var result = _expenseService.ExportToPdf(filter ?? new ExpenseFilterDto());
            if (!result.Success)
                return BadRequest(result.Message);
            if (result.Data == null || result.Data.Length == 0)
                return BadRequest("PDF oluşturulamadı.");
            var fileName = $"MasrafFormu_{DateTime.Now:yyyyMMdd_HHmm}.pdf";
            return File(result.Data, "application/pdf", fileName);
        }

        /// <summary>Tek bir masraf kaydini rapor formatinda PDF olarak indirir.</summary>
        [HttpGet("exportToPdf/{id}")]
        public IActionResult ExportSingleToPdf(int id)
        {
            var result = _expenseService.ExportSingleToPdf(id);
            if (!result.Success)
            {
                if (string.Equals(result.Message, "Masraf bulunamadı.", StringComparison.Ordinal))
                    return NotFound(new { message = "Masraf bulunamadı." });
                return BadRequest(new { message = result.Message ?? "PDF oluşturulamadı." });
            }
            if (result.Data == null || result.Data.Length == 0)
                return BadRequest(new { message = "PDF oluşturulamadı." });
            var fileName = $"MasrafRaporu_{id}.pdf";
            return File(result.Data, "application/pdf", fileName);
        }

        /// <summary>Bazı istemciler UUID veya masraf id'sini <c>draft_...</c> önekiyle gönderir.</summary>
        private static string NormalizeExpenseDraftRouteKey(string draftKey)
        {
            if (string.IsNullOrWhiteSpace(draftKey))
                return draftKey ?? "";
            var key = draftKey.Trim();
            const string prefix = "draft_";
            if (key.Length > prefix.Length && key.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            {
                var rest = key.Substring(prefix.Length).Trim();
                if (!string.IsNullOrEmpty(rest))
                {
                    if (Guid.TryParse(rest, out _) ||
                        int.TryParse(rest, NumberStyles.Integer, CultureInfo.InvariantCulture, out _))
                        return rest;
                }
            }
            return key;
        }
    }
}