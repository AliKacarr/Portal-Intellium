using Business.Repository.DocumentRepository;
using Core.Utilities.Results.Concrete;
using Entities.Concrete;
using Entities.DTOs.DocumentDto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using Core.Identity;

namespace WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DocumentController : ControllerBase
    {
        private readonly IDocumentService _documentService;

        public DocumentController(IDocumentService documentService)
        {
            _documentService = documentService;

        }

        private long? GetCallerUserId()
        {
            var raw = User?.FindFirstValue(ClaimTypes.NameIdentifier);
            return long.TryParse(raw, out var id) ? id : null;
        }

        private bool IsAdminCaller()
        {
            // JWT claim roles: ClaimTypes.Role
            return User?.IsInRole(RoleNames.Admin) == true;
        }

        [HttpPost("add")]
        [RequestSizeLimit(52 * 1024 * 1024)]
        public IActionResult Add(DocumentDto documentDto)
        {
            var callerId = GetCallerUserId();
            if (callerId == null)
                return Unauthorized("Kimlik doğrulanamadı.");

            // user sadece kendi adına ekler; admin seçilen userId ile ekleyebilir.
            if (!IsAdminCaller())
            {
                documentDto.UserId = callerId.Value;
            }
            else if (documentDto.UserId <= 0)
            {
                documentDto.UserId = callerId.Value;
            }

            var result = _documentService.Add(documentDto);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result.Message);
        }

        [HttpPut("update/{Id}")]
        [RequestSizeLimit(52 * 1024 * 1024)]
        public IActionResult Update(int Id, [FromBody] DocumentDto documentDto)
        {
            var callerId = GetCallerUserId();
            if (callerId == null)
                return Unauthorized("Kimlik doğrulanamadı.");

            // Route Id her zaman öncelikli
            documentDto.Id = Id;

            if (!IsAdminCaller())
            {
                documentDto.UserId = callerId.Value;
            }
            else if (documentDto.UserId <= 0)
            {
                // Admin userId göndermediyse mevcut kaydın userId'sine göre kontrol etmek için GetById
                var existing = _documentService.GetById(Id);
                if (!existing.Success || existing.Data == null)
                    return NotFound("Document not found");
                documentDto.UserId = existing.Data.UserId;
            }

            var result = _documentService.Update(documentDto);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result.Message);
        }

        [HttpDelete("delete/{Id}")]

        public IActionResult Delete(int Id)
        {
            var callerId = GetCallerUserId();
            if (callerId == null)
                return Unauthorized("Kimlik doğrulanamadı.");

            // Yetki kontrolü: user sadece kendi dokümanını silebilir; admin hepsini.
            var existing = _documentService.GetById(Id);
            if (!existing.Success || existing.Data == null)
                return NotFound("Document not found");

            if (!IsAdminCaller() && existing.Data.UserId != callerId.Value)
                return Forbid();

            var result = _documentService.Delete(Id);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }
        [HttpGet("getAllByUserId")]
        public IActionResult GetAllByUserId(long userId)
        {
            var callerId = GetCallerUserId();
            if (callerId == null)
                return Unauthorized("Kimlik doğrulanamadı.");

            var targetUserId = IsAdminCaller() ? (userId > 0 ? userId : callerId.Value) : callerId.Value;
            var result = _documentService.GetAllByUserId(targetUserId);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result.Message);
        }

        [HttpGet("GetById")]
        public IActionResult GetById(int Id)
        {
            var callerId = GetCallerUserId();
            if (callerId == null)
                return Unauthorized("Kimlik doğrulanamadı.");

            var result = _documentService.GetById(Id);
            if (result.Success)
            {
                // user sadece kendi dokümanını görebilir; admin hepsini
                if (result.Data != null && !IsAdminCaller() && result.Data.UserId != callerId.Value)
                    return Forbid();
                return Ok(result);
            }
            return BadRequest(result.Message);
        }

        [HttpGet("getAll")]

        public IActionResult GetAll()
        {
            if (!IsAdminCaller())
                return Forbid();

            var result = _documentService.GetAll();
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result.Message);
        }

        // Frontend uyumluluğu: Dokümanlar ekranı /api/Document/GetDocumentsByParent?parent=0 çağırıyor
        // Mevcut servis katmanında direkt parent filtresi yok; burada GetAll() üzerinden filtreliyoruz.
        [HttpGet("GetDocumentsByParent")]
        public IActionResult GetDocumentsByParent([FromQuery] int parent = 0, [FromQuery] long? userId = null)
        {
            var callerId = GetCallerUserId();
            if (callerId == null)
                return Unauthorized("Kimlik doğrulanamadı.");

            var targetUserId = IsAdminCaller()
                ? (userId.HasValue && userId.Value > 0 ? userId.Value : callerId.Value)
                : callerId.Value;

            var result = _documentService.GetAllByUserId(targetUserId);
            if (!result.Success || result.Data == null)
            {
                return Ok(new ErrorDataResult<List<Document>>(new List<Document>(), result.Message));
            }

            var filtered = result.Data.Where(d => d.Parent == parent).ToList();
            return Ok(new SuccessDataResult<List<Document>>(filtered));
        }

    }

}