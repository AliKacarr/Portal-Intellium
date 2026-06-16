using Business.Repository.NoteRepository;
using Core.Identity;
using DataAccess.Repository.UserRepository;
using Entities.DTOs.NoteDtos;
using iTextSharp.text;
using iTextSharp.text.pdf;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Globalization;

namespace WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NotesController : ControllerBase
    {
        private readonly INotesAppService _notesAppService;
        private readonly IUserContext _userContext;
        private readonly IUserDal _userDal;
        private readonly IConfiguration _configuration;

        public NotesController(INotesAppService notesAppService, IUserContext userContext, IUserDal userDal, IConfiguration configuration)
        {
            _notesAppService = notesAppService;
            _userContext = userContext;
            _userDal = userDal;
            _configuration = configuration;
        }

        [HttpGet]
        public IActionResult GetNotes(
            [FromQuery] string sortBy = "updatedAt",
            [FromQuery] string order = "desc",
            // Çöp kutusu uyumluluğu: bazı frontend'ler deleted/isDeleted parametresi gönderebilir
            [FromQuery] bool deleted = false,
            [FromQuery] bool isDeleted = false)
        {
            if (!_userContext.IsAuthenticated) return Unauthorized();
            try
            {
                var wantsDeleted = deleted || isDeleted;
                var list = wantsDeleted
                    ? (_notesAppService.GetDeletedNotesByUserId(_userContext.UserId, sortBy, order) ?? new List<NoteDto>())
                    : (_notesAppService.GetNotesByUserId(_userContext.UserId, sortBy, order) ?? new List<NoteDto>());
                return Ok(list);
            }
            catch (Exception)
            {
                return Ok(new List<NoteDto>());
            }
        }

        // Çöp kutusu için explicit endpoint + alias'lar
        [HttpGet("deleted")]
        [HttpGet("trash")]
        [HttpGet("recycle-bin")]
        public IActionResult GetDeletedNotes([FromQuery] string sortBy = "updatedAt", [FromQuery] string order = "desc")
        {
            if (!_userContext.IsAuthenticated) return Unauthorized();
            try
            {
                var list = _notesAppService.GetDeletedNotesByUserId(_userContext.UserId, sortBy, order) ?? new List<NoteDto>();
                return Ok(list);
            }
            catch
            {
                return Ok(new List<NoteDto>());
            }
        }

        // Frontend uyumluluğu: eski çağrılar /api/notes/getAll kullanabiliyor
        [HttpGet("getAll")]
        public IActionResult GetAllAlias(
            [FromQuery] string sortBy = "updatedAt",
            [FromQuery] string order = "desc",
            [FromQuery] bool deleted = false,
            [FromQuery] bool isDeleted = false) => GetNotes(sortBy, order, deleted, isDeleted);

        [HttpGet("{id}")]
        public IActionResult GetNoteById(Guid id)
        {
            if (!_userContext.IsAuthenticated) return Unauthorized();
            try
            {
                var note = _notesAppService.GetNoteById(id, _userContext.UserId);
                if (note == null) return NotFound();
                return Ok(note);
            }
            catch (Exception)
            {
                return NotFound();
            }
        }

        [HttpPost]
        public IActionResult CreateNote([FromBody] NoteCreateUpdateDto dto)
        {
            if (!_userContext.IsAuthenticated) return Unauthorized();
            if (dto == null) dto = new NoteCreateUpdateDto();
            try
            {
                var created = _notesAppService.CreateNote(_userContext.UserId, dto);
                return CreatedAtAction(nameof(GetNoteById), new { id = created.Id }, created);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Not oluşturulamadı.", title = ex.Message });
            }
        }

        // Frontend uyumluluğu: eski çağrılar /api/notes/add kullanabiliyor
        [HttpPost("add")]
        public IActionResult AddAlias([FromBody] NoteCreateUpdateDto dto) => CreateNote(dto);

        [AllowAnonymous]
        [HttpPost("from-ai")]
        public IActionResult CreateNotesFromAi([FromBody] AiNoteWebhookDto body)
        {
            var serviceKey = Request.Headers["X-Service-Key"].FirstOrDefault();
            var expectedKey = _configuration["ServiceKeys:PortalMeet"];

            if (string.IsNullOrWhiteSpace(serviceKey) ||
                string.IsNullOrWhiteSpace(expectedKey) ||
                !string.Equals(serviceKey, expectedKey, StringComparison.Ordinal))
            {
                return Unauthorized(new { message = "Geçersiz servis anahtarı." });
            }

            if (body == null)
            {
                return BadRequest(new { message = "İstek body'si boş olamaz." });
            }

            if (string.IsNullOrWhiteSpace(body.Email))
            {
                return BadRequest(new { message = "Email alanı boş olamaz." });
            }

            var normalizedEmail = body.Email.Trim();
            var user = _userDal.GetAll()
                .FirstOrDefault(u => string.Equals(u.Email?.Trim(), normalizedEmail, StringComparison.OrdinalIgnoreCase));
            if (user == null)
            {
                return NotFound(new { message = "Kullanıcı bulunamadı." });
            }

            var noteItems = body.Notes ?? new List<AiWebhookNoteItemDto>();
            if (noteItems.Count == 0)
            {
                return BadRequest(new { message = "Oluşturulacak not bulunamadı." });
            }

            var folderName = string.IsNullOrWhiteSpace(body.FolderName) ? "Portal Meet" : body.FolderName.Trim();
            _notesAppService.CreateFolder(folderName);

            var createdNotes = new List<NoteDto>();
            foreach (var noteItem in noteItems)
            {
                var dto = new NoteCreateUpdateDto
                {
                    Title = noteItem?.Title ?? "",
                    Content = noteItem?.Content ?? "",
                    FolderId = folderName
                };

                createdNotes.Add(_notesAppService.CreateNote(user.Id, dto));
            }

            return Ok(new
            {
                message = "Notlar oluşturuldu.",
                email = user.Email,
                folderName,
                count = createdNotes.Count,
                notes = createdNotes
            });
        }

        [HttpPut("{id}")]
        public IActionResult UpdateNote(Guid id, [FromBody] NoteCreateUpdateDto dto)
        {
            if (!_userContext.IsAuthenticated) return Unauthorized();
            try
            {
                var updated = _notesAppService.UpdateNote(id, _userContext.UserId, dto);
                if (updated == null) return NotFound(new { message = "Not bulunamadı." });
                return Ok(updated);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { message = ex.Message });
            }
            catch (Exception ex)
            {
                // folderId/folderIds geçersiz veya klasör bulunamadı vb.
                return BadRequest(new { message = "Not güncellenemedi.", title = ex.Message });
            }
        }

        [HttpPatch("{id}/reminder")]
        public IActionResult SetReminder(Guid id, [FromBody] SetNoteReminderDto dto)
        {
            if (!_userContext.IsAuthenticated) return Unauthorized();
            dto ??= new SetNoteReminderDto();

            try
            {
                DateTime? reminderUtc = null;
                var raw = (dto.ReminderAt ?? "").Trim();
                if (!string.IsNullOrWhiteSpace(raw))
                {
                    // Frontend ISO-8601 + offset gönderir (örn: 2026-05-11T11:38:00+03:00).
                    if (DateTimeOffset.TryParse(raw, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var dtoff))
                    {
                        reminderUtc = dtoff.UtcDateTime;
                    }
                    else
                    {
                        return BadRequest(new { message = "Geçersiz tarih formatı." });
                    }
                }

                var updated = _notesAppService.SetReminder(id, _userContext.UserId, reminderUtc);
                if (updated == null) return NotFound(new { message = "Not bulunamadı." });
                return Ok(updated);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Hatırlatıcı güncellenemedi.", title = ex.Message });
            }
        }

        [HttpPost("{id}/reminders")]
        public IActionResult AddReminder(Guid id, [FromBody] SetNoteReminderDto dto)
        {
            if (!_userContext.IsAuthenticated) return Unauthorized();
            dto ??= new SetNoteReminderDto();

            var raw = (dto.ReminderAt ?? "").Trim();
            if (string.IsNullOrWhiteSpace(raw))
                return BadRequest(new { message = "Tarih/saat boş olamaz." });

            try
            {
                if (!DateTimeOffset.TryParse(raw, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var dtoff))
                    return BadRequest(new { message = "Geçersiz tarih formatı." });

                var updated = _notesAppService.AddReminder(id, _userContext.UserId, dtoff.UtcDateTime);
                if (updated == null) return NotFound(new { message = "Not bulunamadı." });
                return Ok(updated);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Hatırlatıcı eklenemedi.", title = ex.Message });
            }
        }

        [HttpDelete("{id}/reminders/{reminderId}")]
        public IActionResult DeleteReminder(Guid id, Guid reminderId)
        {
            if (!_userContext.IsAuthenticated) return Unauthorized();
            try
            {
                var ok = _notesAppService.DeleteReminder(id, reminderId, _userContext.UserId);
                if (!ok) return NotFound(new { message = "Hatırlatıcı bulunamadı." });
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Hatırlatıcı silinemedi.", title = ex.Message });
            }
        }

        // Frontend uyumluluğu: eski çağrılar /api/notes/update/{id} kullanabiliyor
        [HttpPut("update/{id}")]
        public IActionResult UpdateAlias(Guid id, [FromBody] NoteCreateUpdateDto dto) => UpdateNote(id, dto);

        /// <summary>Notu sabitler / sabiti kaldırır. Body: { isPinned: true/false } veya query: ?isPinned=true. Boş gelirse toggle.</summary>
        [HttpPatch("{id}/pin")]
        public async Task<IActionResult> Pin(Guid id, [FromQuery] bool? isPinned)
        {
            if (!_userContext.IsAuthenticated) return Unauthorized();
            try
            {
                bool? value = isPinned;
                if (value == null && Request.ContentLength.HasValue && Request.ContentLength.Value > 0)
                {
                    using var reader = new StreamReader(Request.Body);
                    var raw = await reader.ReadToEndAsync();
                    if (!string.IsNullOrWhiteSpace(raw))
                    {
                        using var doc = JsonDocument.Parse(raw);
                        if (doc.RootElement.ValueKind == JsonValueKind.Object &&
                            doc.RootElement.TryGetProperty("isPinned", out var p))
                        {
                            if (p.ValueKind == JsonValueKind.True) value = true;
                            else if (p.ValueKind == JsonValueKind.False) value = false;
                        }
                    }
                }

                var updated = _notesAppService.SetPinned(id, _userContext.UserId, value);
                if (updated == null) return NotFound(new { message = "Not bulunamadı." });
                return Ok(updated);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Sabitleme işlemi başarısız.", title = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteNote(Guid id, [FromQuery] bool permanent = false)
        {
            if (!_userContext.IsAuthenticated) return Unauthorized();
            if (permanent)
            {
                var ok = _notesAppService.PermanentDeleteNote(id, _userContext.UserId);
                if (!ok) return NotFound(new { message = "Not bulunamadı." });
                return NoContent();
            }
            _notesAppService.DeleteNote(id, _userContext.UserId);
            return NoContent();
        }

        // Frontend uyumluluğu: eski çağrılar /api/notes/delete/{id} kullanabiliyor
        [HttpDelete("delete/{id}")]
        public IActionResult DeleteAlias(Guid id, [FromQuery] bool permanent = false) => DeleteNote(id, permanent);

        // Frontend uyumluluğu: bazı sürümler /api/notes/delete?id=:id (query) deneyebiliyor
        [HttpDelete("delete")]
        public IActionResult DeleteByQuery([FromQuery] Guid id, [FromQuery] bool permanent = false) => DeleteNote(id, permanent);

        // Kalıcı silme alias'ları
        [HttpDelete("{id}/permanent")]
        public IActionResult PermanentDelete(Guid id)
        {
            if (!_userContext.IsAuthenticated) return Unauthorized();
            var ok = _notesAppService.PermanentDeleteNote(id, _userContext.UserId);
            if (!ok) return NotFound(new { message = "Not bulunamadı." });
            return NoContent();
        }

        [HttpDelete("{id}/hard-delete")]
        public IActionResult HardDelete(Guid id) => PermanentDelete(id);

        /// <summary>Nota etiket ekler. tagId: Guid veya etiket adı (örn. "deneme2"); ad yoksa oluşturulup eklenir.</summary>
        [HttpPost("{noteId}/tags/{tagId}")]
        public IActionResult AddTagToNote(Guid noteId, string tagId)
        {
            if (!_userContext.IsAuthenticated) return Unauthorized();
            try
            {
                if (string.IsNullOrWhiteSpace(tagId)) return BadRequest(new { message = "tagId boş olamaz." });
                var ok = _notesAppService.AddTagToNote(noteId, _userContext.UserId, tagId.Trim());
                if (!ok) return NotFound(new { message = "Not bulunamadı veya etiket eklenemedi." });
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { message = ex.Message });
            }
        }

        /// <summary>Notadan etiketi kaldırır. tagId: Guid veya etiket adı.</summary>
        [HttpDelete("{noteId}/tags/{tagId}")]
        public IActionResult RemoveTagFromNote(Guid noteId, string tagId)
        {
            if (!_userContext.IsAuthenticated) return Unauthorized();
            try
            {
                if (string.IsNullOrWhiteSpace(tagId)) return BadRequest(new { message = "tagId boş olamaz." });
                var ok = _notesAppService.RemoveTagFromNote(noteId, _userContext.UserId, tagId.Trim());
                if (!ok) return NotFound(new { message = "Not veya etiket bulunamadı." });
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { message = ex.Message });
            }
        }

        /// <summary>Notu bir klasöre atar/taşır. folderId: Guid veya klasör adı (örn. "mehmet").</summary>
        [HttpPost("{noteId}/folders/{folderId}")]
        public IActionResult AssignFolderToNote(Guid noteId, string folderId)
        {
            if (!_userContext.IsAuthenticated) return Unauthorized();
            try
            {
                if (string.IsNullOrWhiteSpace(folderId)) return BadRequest(new { message = "folderId boş olamaz." });
                var ok = _notesAppService.AssignFolderToNote(noteId, _userContext.UserId, folderId.Trim());
                if (!ok) return NotFound(new { message = "Not veya klasör bulunamadı." });
                var updated = _notesAppService.GetNoteById(noteId, _userContext.UserId);
                return Ok(updated);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { message = ex.Message });
            }
        }

        /// <summary>Notun klasör atamasını kaldırır. folderId: Guid veya klasör adı.</summary>
        [HttpDelete("{noteId}/folders/{folderId}")]
        public IActionResult RemoveFolderFromNote(Guid noteId, string folderId)
        {
            if (!_userContext.IsAuthenticated) return Unauthorized();
            try
            {
                if (string.IsNullOrWhiteSpace(folderId)) return BadRequest(new { message = "folderId boş olamaz." });
                var ok = _notesAppService.RemoveFolderFromNote(noteId, _userContext.UserId, folderId.Trim());
                if (!ok) return NotFound(new { message = "Not veya klasör bulunamadı." });
                var updated = _notesAppService.GetNoteById(noteId, _userContext.UserId);
                return Ok(updated);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { message = ex.Message });
            }
        }

        /// <summary>Notu klasörden çıkarır (root). Frontend bazı sürümlerde folderId göndermiyor.</summary>
        [HttpDelete("{noteId}/folder")]
        public IActionResult ClearFolderFromNote(Guid noteId)
        {
            if (!_userContext.IsAuthenticated) return Unauthorized();
            try
            {
                var ok = _notesAppService.ClearFolderFromNote(noteId, _userContext.UserId);
                if (!ok) return NotFound(new { message = "Not bulunamadı." });
                var updated = _notesAppService.GetNoteById(noteId, _userContext.UserId);
                return Ok(updated);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { message = ex.Message });
            }
        }

        // Alias: bazı sürümler /folders (folderId olmadan) çağırabilir
        [HttpDelete("{noteId}/folders")]
        public IActionResult ClearFolderFromNoteAlias(Guid noteId) => ClearFolderFromNote(noteId);

        // Dışa aktar (PDF / Metin)
        // Frontend uyumluluğu için birkaç alias sağlanır.
        [HttpGet("{id}/export")]
        public IActionResult Export(Guid id, [FromQuery] string format = "pdf")
        {
            if (!_userContext.IsAuthenticated) return Unauthorized();
            var note = _notesAppService.GetNoteById(id, _userContext.UserId);
            if (note == null) return NotFound(new { message = "Not bulunamadı." });
            var normalized = (format ?? "").Trim().ToLowerInvariant();
            if (normalized == "txt" || normalized == "text" || normalized == "plain")
                return ExportText(note);
            return ExportPdf(note);
        }

        [HttpGet("{id}/export/pdf")]
        public IActionResult ExportPdfByRoute(Guid id)
        {
            if (!_userContext.IsAuthenticated) return Unauthorized();
            var note = _notesAppService.GetNoteById(id, _userContext.UserId);
            if (note == null) return NotFound(new { message = "Not bulunamadı." });
            return ExportPdf(note);
        }

        [HttpGet("{id}/export/text")]
        public IActionResult ExportTextByRoute(Guid id)
        {
            if (!_userContext.IsAuthenticated) return Unauthorized();
            var note = _notesAppService.GetNoteById(id, _userContext.UserId);
            if (note == null) return NotFound(new { message = "Not bulunamadı." });
            return ExportText(note);
        }

        // Bazı sürümler /pdf veya /txt gibi kısa route deneyebilir
        [HttpGet("{id}/pdf")]
        public IActionResult PdfAlias(Guid id) => Export(id, "pdf");

        [HttpGet("{id}/txt")]
        public IActionResult TxtAlias(Guid id) => Export(id, "text");

        private IActionResult ExportText(NoteDto note)
        {
            var title = string.IsNullOrWhiteSpace(note.Title) ? "not" : note.Title.Trim();
            var safeName = MakeSafeFileName(title);
            var content = HtmlToPlainText(note.Content ?? "");
            var bytes = Encoding.UTF8.GetBytes(content);
            return File(bytes, "text/plain; charset=utf-8", $"{safeName}.txt");
        }

        private IActionResult ExportPdf(NoteDto note)
        {
            var title = string.IsNullOrWhiteSpace(note.Title) ? "not" : note.Title.Trim();
            var safeName = MakeSafeFileName(title);
            var plain = HtmlToPlainText(note.Content ?? "");

            using var ms = new MemoryStream();
            var doc = new Document(PageSize.A4, 36, 36, 36, 36);
            var writer = PdfWriter.GetInstance(doc, ms);
            doc.Open();

            var font = CreateUnicodeFontOrFallback();
            doc.Add(new Paragraph(title, font) { SpacingAfter = 12f });
            doc.Add(new Paragraph(plain, font));

            doc.Close();
            writer.Close();

            var bytes = ms.ToArray();
            return File(bytes, "application/pdf", $"{safeName}.pdf");
        }

        private static Font CreateUnicodeFontOrFallback()
        {
            try
            {
                var arialPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Windows), "Fonts", "arial.ttf");
                if (System.IO.File.Exists(arialPath))
                {
                    var bf = BaseFont.CreateFont(arialPath, BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
                    return new Font(bf, 12, Font.NORMAL);
                }
            }
            catch
            {
                // fallback below
            }
            return FontFactory.GetFont(FontFactory.HELVETICA, 12, Font.NORMAL);
        }

        [HttpGet("shared")]
        public IActionResult GetSharedNotes()
        {
            if (!_userContext.IsAuthenticated) return Unauthorized();
            try
            {
                var list = _notesAppService.GetSharedNotes(_userContext.UserId);
                return Ok(list);
            }
            catch (Exception)
            {
                return Ok(new List<NoteDto>());
            }
        }

        // "Paylaşılan notlar" ekranında: benim başkalarıyla paylaştığım notlar
        [HttpGet("shared-by-me")]
        public IActionResult GetNotesSharedByMe()
        {
            if (!_userContext.IsAuthenticated) return Unauthorized();
            try
            {
                var list = _notesAppService.GetNotesSharedByMe(_userContext.UserId);
                return Ok(list ?? new List<NoteDto>());
            }
            catch (Exception)
            {
                return Ok(new List<NoteDto>());
            }
        }

        // Alias'lar (frontend farklı route'lar deneyebilir)
        [HttpGet("shared/owned")]
        public IActionResult GetNotesSharedByMeAlias1() => GetNotesSharedByMe();

        [HttpGet("shared-by-me/owned")]
        public IActionResult GetNotesSharedByMeAlias2() => GetNotesSharedByMe();

        [HttpPost("{id}/share")]
        public IActionResult ShareNote(Guid id, [FromBody] JsonElement body)
        {
            if (!_userContext.IsAuthenticated) return Unauthorized();
            try
            {
                var targetUserId = ResolveTargetUserId(body);
                if (targetUserId == null) return NotFound(new { message = "Paylaşılacak kullanıcı bulunamadı." });
                var readOnly = GetBoolFromBody(body, "readOnly", "ReadOnly") ?? false;

                var dto = new NoteShareDto { UserId = targetUserId.Value, IsReadOnly = readOnly };
                var ok = _notesAppService.ShareNote(id, _userContext.UserId, dto);
                if (!ok) return NotFound(new { message = "Not bulunamadı." });
                return NoContent();
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Paylaşım işlemi başarısız.", title = ex.Message });
            }
        }

        private long? ResolveTargetUserId(JsonElement body)
        {
            // userId: number veya string olabilir (bazı frontend sürümleri value olarak isim gönderiyor)
            var userIdRaw = GetStringOrNumber(body, "userId", "UserId");
            if (!string.IsNullOrWhiteSpace(userIdRaw))
            {
                if (long.TryParse(userIdRaw.Trim(), out var id)) return id;

                var key = userIdRaw.Trim();
                var user = _userDal.GetAll()
                    .FirstOrDefault(u =>
                        string.Equals(u.Email?.Trim(), key, StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(u.Name?.Trim(), key, StringComparison.OrdinalIgnoreCase));
                return user?.Id;
            }

            // Alternatif alanlar
            var userName = GetStringFromBody(body, "userName", "UserName", "name", "Name", "email", "Email");
            if (string.IsNullOrWhiteSpace(userName)) return null;
            var lookup = userName.Trim();
            var byName = _userDal.GetAll()
                .FirstOrDefault(u =>
                    string.Equals(u.Email?.Trim(), lookup, StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(u.Name?.Trim(), lookup, StringComparison.OrdinalIgnoreCase));
            return byName?.Id;
        }

        private static bool? GetBoolFromBody(JsonElement body, params string[] keys)
        {
            if (body.ValueKind != JsonValueKind.Object) return null;
            foreach (var key in keys)
            {
                if (!body.TryGetProperty(key, out var val)) continue;
                if (val.ValueKind == JsonValueKind.True) return true;
                if (val.ValueKind == JsonValueKind.False) return false;
                if (val.ValueKind == JsonValueKind.String && bool.TryParse(val.GetString(), out var b)) return b;
            }
            return null;
        }

        private static string GetStringOrNumber(JsonElement body, params string[] keys)
        {
            if (body.ValueKind != JsonValueKind.Object) return null;
            foreach (var key in keys)
            {
                if (!body.TryGetProperty(key, out var val)) continue;
                if (val.ValueKind == JsonValueKind.Number) return val.GetInt64().ToString();
                if (val.ValueKind == JsonValueKind.String) return val.GetString();
            }
            return null;
        }

        private static string GetStringFromBody(JsonElement body, params string[] keys)
        {
            if (body.ValueKind != JsonValueKind.Object) return null;
            foreach (var key in keys)
            {
                if (!body.TryGetProperty(key, out var val)) continue;
                if (val.ValueKind == JsonValueKind.String) return val.GetString();
            }
            return null;
        }

        [HttpDelete("{id}/share/{targetUserId}")]
        public IActionResult UnshareNote(Guid id, long targetUserId)
        {
            if (!_userContext.IsAuthenticated) return Unauthorized();
            try
            {
                var ok = _notesAppService.UnshareNote(id, _userContext.UserId, targetUserId);
                if (!ok) return NotFound(new { message = "Not bulunamadı." });
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Paylaşım kaldırma işlemi başarısız.", title = ex.Message });
            }
        }

        [HttpGet("{id}/shares")]
        public IActionResult GetNoteShares(Guid id)
        {
            if (!_userContext.IsAuthenticated) return Unauthorized();
            try
            {
                var list = _notesAppService.GetNoteShares(id, _userContext.UserId);
                if (list == null) return NotFound(new { message = "Not bulunamadı." });
                return Ok(list);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Paylaşım listesi alınamadı.", title = ex.Message });
            }
        }

        [HttpGet("{id}/share/list")]
        public IActionResult GetNoteSharesAlias(Guid id) => GetNoteShares(id);

        // Bazı frontend sürümleri paylaşım listesini /share üzerinden GET atabiliyor.
        // Bu alias 405 Method Not Allowed hatasını engeller.
        [HttpGet("{id}/share")]
        public IActionResult GetNoteSharesAlias2(Guid id) => GetNoteShares(id);

        [HttpPatch("{id}/share/{targetUserId}")]
        public IActionResult UpdateNoteShare(Guid id, long targetUserId, [FromBody] NoteShareUpdateDto dto)
        {
            if (!_userContext.IsAuthenticated) return Unauthorized();
            try
            {
                var ok = _notesAppService.UpdateNoteShare(id, _userContext.UserId, targetUserId, dto.ReadOnly);
                if (!ok) return NotFound(new { message = "Not veya paylaşım bulunamadı." });
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Paylaşım güncellenemedi.", title = ex.Message });
            }
        }

        // Bazı frontend sürümleri PATCH sırasında targetUserId'yi path'te taşımayabilir.
        // Bu alias /api/notes/{id}/share endpoint'ini PATCH için de destekler.
        [HttpPatch("{id}/share")]
        public IActionResult UpdateNoteShareByBodyOrQuery(
            Guid id,
            [FromQuery] string userId = null,
            [FromQuery] string email = null,
            [FromQuery] string userName = null,
            [FromBody] JsonElement? body = null)
        {
            if (!_userContext.IsAuthenticated) return Unauthorized();
            try
            {
                var targetUserId = ResolveTargetUserIdFlexible(userId, email, userName, body);
                if (targetUserId == null) return NotFound(new { message = "Paylaşımı güncellenecek kullanıcı bulunamadı." });

                var readOnly = false;
                if (body.HasValue)
                {
                    var ro = GetBoolFromBody(body.Value, "readOnly", "ReadOnly");
                    if (ro.HasValue) readOnly = ro.Value;
                }

                var ok = _notesAppService.UpdateNoteShare(id, _userContext.UserId, targetUserId.Value, readOnly);
                if (!ok) return NotFound(new { message = "Not veya paylaşım bulunamadı." });
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Paylaşım güncellenemedi.", title = ex.Message });
            }
        }

        // Bazı frontend sürümleri "paylaşımı kaldır" için path'te userId göndermeyip
        // query/body üzerinden gönderebiliyor. Bu alias bunu destekler.
        [HttpDelete("{id}/share")]
        public IActionResult UnshareNoteByBodyOrQuery(
            Guid id,
            [FromQuery] string userId = null,
            [FromQuery] string email = null,
            [FromQuery] string userName = null,
            [FromBody] JsonElement? body = null)
        {
            if (!_userContext.IsAuthenticated) return Unauthorized();
            try
            {
                var targetUserId = ResolveTargetUserIdFlexible(userId, email, userName, body);
                if (targetUserId == null) return NotFound(new { message = "Paylaşımı kaldırılacak kullanıcı bulunamadı." });

                var ok = _notesAppService.UnshareNote(id, _userContext.UserId, targetUserId.Value);
                if (!ok) return NotFound(new { message = "Not bulunamadı." });
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Paylaşım kaldırma işlemi başarısız.", title = ex.Message });
            }
        }

        private long? ResolveTargetUserIdFlexible(string userId, string email, string userName, JsonElement? body)
        {
            // 1) Body varsa mevcut çözümleyiciyi kullan
            if (body.HasValue)
            {
                var b = body.Value;
                if (b.ValueKind != JsonValueKind.Undefined && b.ValueKind != JsonValueKind.Null)
                {
                    var fromBody = ResolveTargetUserId(b);
                    if (fromBody != null) return fromBody;
                }
            }

            // 2) Query string üzerinden dene
            var raw = userId;
            if (string.IsNullOrWhiteSpace(raw)) raw = email;
            if (string.IsNullOrWhiteSpace(raw)) raw = userName;
            if (string.IsNullOrWhiteSpace(raw)) return null;

            raw = raw.Trim();
            if (long.TryParse(raw, out var id)) return id;

            var user = _userDal.GetAll()
                .FirstOrDefault(u =>
                    string.Equals(u.Email?.Trim(), raw, StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(u.Name?.Trim(), raw, StringComparison.OrdinalIgnoreCase));
            return user?.Id;
        }

        private static string HtmlToPlainText(string html)
        {
            if (string.IsNullOrWhiteSpace(html)) return "";

            var text = html;

            // 1. Convert <br> tags to newlines BEFORE processing blocks
            text = Regex.Replace(text, @"<br\s*/?>", "\n", RegexOptions.IgnoreCase);

            // 2. Handle Ordered Lists (<ol>) to preserve numbering
            // We use a loop to process innermost <ol> blocks first to handle nesting correctly
            bool replaced;
            do
            {
                replaced = false;
                // Innermost <ol> block match: <ol ...> followed by content with NO other <ol, ending with </ol>
                text = Regex.Replace(text, @"<ol\b[^>]*>((?:(?!<ol\b).)*?)</ol>", m => {
                    replaced = true;
                    var inner = m.Groups[1].Value;
                    int count = 1;
                    return Regex.Replace(inner, @"<li\b[^>]*>", _ => $"\n {count++}. ", RegexOptions.IgnoreCase);
                }, RegexOptions.IgnoreCase | RegexOptions.Singleline);
            } while (replaced);

            // 3. Handle Remaining List items (Unordered <ul> or stray <li>)
            text = Regex.Replace(text, @"<li\b[^>]*>", "\n - ", RegexOptions.IgnoreCase);
            
            // 4. Block level tags -> ensure they are separated by newlines
            string blockElements = "p|div|h[1-6]|blockquote|pre|table|tr|ul|ol|header|footer|section|article|aside";
            text = Regex.Replace(text, $@"</?({blockElements})\b[^>]*>", "\n", RegexOptions.IgnoreCase);

            // 5. Strip all remaining HTML tags
            text = Regex.Replace(text, @"<[^>]+>", " ");

            // 6. Decode HTML entities (e.g. &nbsp;, &lt;)
            text = System.Net.WebUtility.HtmlDecode(text);

            // 7. Clean up whitespace
            // Normalize horizontal whitespace (spaces, tabs)
            text = Regex.Replace(text, @"[ \t\f\v]+", " ");

            // 8. Final structure normalization
            // Split by any newline, trim each line, then join with CRLF (\r\n)
            var lines = text.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.None)
                            .Select(line => line.Trim());

            // Collapse multiple empty lines into at most one empty line
            var resultLines = new List<string>();
            bool lastWasEmpty = false;
            foreach (var line in lines)
            {
                if (string.IsNullOrWhiteSpace(line))
                {
                    if (!lastWasEmpty && resultLines.Count > 0)
                    {
                        resultLines.Add("");
                        lastWasEmpty = true;
                    }
                }
                else
                {
                    resultLines.Add(line);
                    lastWasEmpty = false;
                }
            }

            return string.Join("\r\n", resultLines).Trim();
        }
        

        private static string MakeSafeFileName(string name)
        {
            var invalid = Path.GetInvalidFileNameChars();
            var cleaned = new string((name ?? "not").Select(ch => invalid.Contains(ch) ? '_' : ch).ToArray());
            cleaned = cleaned.Trim().Trim('.');
            return string.IsNullOrWhiteSpace(cleaned) ? "not" : cleaned;
        }
    }
}
