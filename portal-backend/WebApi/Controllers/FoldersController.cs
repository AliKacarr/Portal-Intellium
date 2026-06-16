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
    public class FoldersController : ControllerBase
    {
        private readonly INotesAppService _notesAppService;
        private readonly IUserContext _userContext;

        public FoldersController(INotesAppService notesAppService, IUserContext userContext)
        {
            _notesAppService = notesAppService;
            _userContext = userContext;
        }

        [HttpGet]
        public IActionResult GetAll()
        {
            if (!_userContext.IsAuthenticated) return Unauthorized();
            try
            {
                var list = _notesAppService.GetAllFolders(_userContext.UserId);
                return Ok(list ?? new List<FolderDto>());
            }
            catch (Exception)
            {
                return Ok(new List<FolderDto>());
            }
        }

        [HttpGet("getAll")]
        public IActionResult GetAllAlias() => GetAll();

        [HttpPost]
        [HttpPost("create")]
        [HttpPost("add")]
        public IActionResult Create([FromBody] JsonElement body)
        {
            if (!_userContext.IsAuthenticated) return Unauthorized();
            try
            {
                var title = GetStringFromBody(body, "title", "Title", "name", "Name", "folderName", "FolderName");
                if (string.IsNullOrWhiteSpace(title))
                    return BadRequest(new { message = "Klasör adı (title/name) zorunludur." });

                var created = _notesAppService.CreateFolder(title);
                return StatusCode(201, created);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Klasör oluşturulamadı.", title = ex.Message });
            }
        }

        [HttpDelete("{folderId}")]
        public IActionResult Delete(string folderId)
        {
            if (!_userContext.IsAuthenticated) return Unauthorized();
            if (string.IsNullOrWhiteSpace(folderId)) return BadRequest(new { message = "folderId boş olamaz." });
            var ok = _notesAppService.DeleteFolder(folderId.Trim(), _userContext.UserId);
            // idempotent: bulunmasa da 204 dön
            return NoContent();
        }

        [HttpDelete("delete/{folderId}")]
        public IActionResult DeleteAlias(string folderId) => Delete(folderId);

        // Bazı frontend sürümleri query ile silebiliyor: /api/folders/delete?id=... veya ?title=...
        [HttpDelete("delete")]
        public IActionResult DeleteByQuery([FromQuery] string id = null, [FromQuery] string title = null)
        {
            var key = !string.IsNullOrWhiteSpace(id) ? id : title;
            if (string.IsNullOrWhiteSpace(key)) return BadRequest(new { message = "id veya title zorunludur." });
            return Delete(key);
        }

        // Bazı frontend sürümleri yanlışlıkla DELETE yerine POST kullanabiliyor.
        [HttpPost("delete")]
        public IActionResult DeleteByQueryPost([FromQuery] string id = null, [FromQuery] string title = null)
            => DeleteByQuery(id, title);

        [HttpPost("delete/{folderId}")]
        public IActionResult DeleteAliasPost(string folderId) => Delete(folderId);

        [HttpPost("{folderId}")]
        public IActionResult DeleteByPost(string folderId) => Delete(folderId);

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
    }
}

