using System;
using System.Collections.Generic;
using System.Text.Json;
using Business.Repository.NoteRepository;
using Core.Identity;
using Entities.DTOs.NoteDtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TagsController : ControllerBase
    {
        private readonly INotesAppService _notesAppService;
        private readonly IUserContext _userContext;

        public TagsController(INotesAppService notesAppService, IUserContext userContext)
        {
            _notesAppService = notesAppService;
            _userContext = userContext;
        }

        [HttpGet("getAll")]
        public IActionResult GetAll()
        {
            try
            {
                if (!_userContext.IsAuthenticated) return Unauthorized();
                var list = _notesAppService.GetAllTags(_userContext.UserId);
                return Ok(list);
            }
            catch (Exception)
            {
                return Ok(new List<TagDto>());
            }
        }

        // Etiket silme (kalıcı ve soft). Frontend genelde id (Guid) ile siler; bazen title da gelebilir.
        [HttpDelete("{tagId}")]
        public IActionResult Delete(string tagId, [FromQuery] bool permanent = false)
        {
            if (string.IsNullOrWhiteSpace(tagId)) return BadRequest(new { message = "tagId boş olamaz." });
            if (!_userContext.IsAuthenticated) return Unauthorized();
            var ok = permanent
                ? _notesAppService.PermanentDeleteTag(tagId.Trim(), _userContext.UserId)
                : _notesAppService.DeleteTag(tagId.Trim(), _userContext.UserId);
            if (!ok) return NotFound(new { message = "Etiket bulunamadı." });
            return NoContent();
        }

        // Alias'lar (bazı frontend sürümleri /delete veya /remove deneyebilir)
        [HttpDelete("delete/{tagId}")]
        public IActionResult DeleteAlias(string tagId, [FromQuery] bool permanent = false) => Delete(tagId, permanent);

        [HttpDelete("remove/{tagId}")]
        public IActionResult RemoveAlias(string tagId, [FromQuery] bool permanent = false) => Delete(tagId, permanent);

        [HttpDelete("delete")]
        public IActionResult DeleteByQuery([FromQuery] string id = null, [FromQuery] string title = null, [FromQuery] bool permanent = false)
        {
            var key = !string.IsNullOrWhiteSpace(id) ? id : title;
            if (string.IsNullOrWhiteSpace(key)) return BadRequest(new { message = "id veya title zorunludur." });
            return Delete(key, permanent);
        }

        // Frontend uyumluluğu: TagsApi farklı route'ları deneyebiliyor.
        [HttpPost]
        [HttpPost("create")]
        [HttpPost("add")]
        [HttpPost("createTag")]
        [HttpPost("addTag")]
        public IActionResult CreateTag(
            [FromBody] JsonElement? body,
            [FromQuery] string? title = null,
            [FromQuery] string? name = null,
            [FromQuery] string? tagName = null,
            [FromQuery] string? colorCode = null,
            [FromQuery] string? ColorCode = null,
            [FromQuery] string? Title = null,
            [FromQuery] string? Name = null,
            [FromQuery] string? TagName = null)
        {
            try
            {
                if (!_userContext.IsAuthenticated) return Unauthorized();
                var tagTitle =
                    GetStringFromBody(body, "title", "Title", "name", "Name", "tagName", "TagName")
                    ?? title ?? name ?? tagName ?? Title ?? Name ?? TagName;
                var cc =
                    GetStringFromBody(body, "colorCode", "ColorCode", "color", "Color")
                    ?? colorCode ?? ColorCode;

                if (string.IsNullOrWhiteSpace(tagTitle))
                    return BadRequest(new { message = "Etiket adı (title/name) zorunludur." });

                var created = _notesAppService.CreateTag(_userContext.UserId, tagTitle, cc ?? "");
                return StatusCode(201, created);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Etiket oluşturulamadı.", title = ex.Message });
            }
        }

        private static string? GetStringFromBody(JsonElement? body, params string[] keys)
        {
            if (!body.HasValue) return null;
            if (body.Value.ValueKind == JsonValueKind.String) return body.Value.GetString();
            if (body.Value.ValueKind != JsonValueKind.Object) return null;
            foreach (var key in keys)
            {
                if (!body.Value.TryGetProperty(key, out var val)) continue;
                if (val.ValueKind == JsonValueKind.String) return val.GetString();
            }
            return null;
        }
    }
}
