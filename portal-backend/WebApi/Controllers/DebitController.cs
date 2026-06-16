using Business.Repository.DebitRepository;
using Core.Identity;
using Entities.Concrete;
using Entities.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace WebApi.Controllers
{
    [Route("api/debit")]
    [ApiController]
    public class DebitController : ControllerBase
    {
        private readonly IDebitService _debitService;

        public DebitController(IDebitService debitService)
        {
            _debitService = debitService;
        }

        [HttpPost("add")]
        public IActionResult Add(Debit debit)
        {
            var result = _debitService.Add(debit);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPut("update")]
        public IActionResult Update(Debit debit)
        {
            var result = _debitService.Update(debit);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteById(int id)
        {
            var getResult = _debitService.GetById(id);
            if (!getResult.Success || getResult.Data == null)
                return NotFound();

            var result = _debitService.Delete(getResult.Data);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("get/{id}")]
        public IActionResult GetById(int id)
        {
            var result = _debitService.GetById(id);
            return result.Success ? Ok(result) : NotFound();
        }

        [HttpGet("getdebits")]
        public IActionResult GetDebits()
        {
            var result = _debitService.GetAllDebitsDto();
            return result.Success ? Ok(result) : NotFound();
        }

        // ✅ GÜNCELLENDİ: PDF'i Tarayıcıda Önizleme (Inline) Olarak Açma
        [HttpGet("download/{id}")]
        public IActionResult Download(int id)
        {
            // 1. Veritabanından kaydı çek
            var result = _debitService.GetById(id);
            
            if (!result.Success || result.Data == null)
            {
                return NotFound("Zimmet kaydı bulunamadı.");
            }

            var debit = result.Data;

            // 2. Dosya kontrolü
            if (debit.PdfFile == null || debit.PdfFile.Length == 0)
            {
                return NotFound("Bu zimmete ait PDF dosyası veritabanında bulunamadı.");
            }

            string fileName = $"Zimmet_Tutanagi_{id}.pdf";

            // ✅ "inline" ayarı: Dosyayı indirmek yerine tarayıcıda açar.
            // Kullanıcı isterse açılan ekrandan sağ üstteki butona basıp indirebilir.
            Response.Headers.Add("Content-Disposition", $"inline; filename={fileName}");

            // 3. Dosyayı gönder (Dosya adını parametre olarak vermiyoruz, Header hallediyor)
            return File(debit.PdfFile, "application/pdf");
        }

        /// <summary>Alıcı: handshake — statü Gönderildi → Teslim Edildi. (REST sözleşmesi örn. PUT /api/debit/confirm-delivery)</summary>
        [HttpPost("confirm-delivery")]
        [Authorize]
        public IActionResult ConfirmDelivery([FromBody] ConfirmDebitDeliveryDto dto)
        {
            var raw = User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!long.TryParse(raw, out var userId))
                return Unauthorized();

            var result = _debitService.ConfirmDeliveryByReceiver(dto.DebitId, userId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>Admin: kullanıcı adına teslim onayı (aynı statü geçişi).</summary>
        [HttpPost("mark-delivered")]
        [Authorize(Roles = RoleNames.Admin)]
        public IActionResult MarkDeliveredByAdmin([FromBody] ConfirmDebitDeliveryDto dto)
        {
            var result = _debitService.MarkDeliveredByAdmin(dto.DebitId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>Alıcı: teslimat red / teslim edilemedi.</summary>
        [HttpPost("handshake/reject")]
        [Authorize]
        public IActionResult MarkDeliveryFailed([FromBody] MarkDeliveryFailedRequestDto dto)
        {
            var raw = User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!long.TryParse(raw, out var userId))
                return Unauthorized();

            var result = _debitService.MarkDeliveryFailedByReceiver(dto.DebitId, userId, dto.Note);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>Admin: teslimat red.</summary>
        [HttpPost("handshake/reject-admin")]
        [Authorize(Roles = RoleNames.Admin)]
        public IActionResult MarkDeliveryFailedByAdmin([FromBody] MarkDeliveryFailedRequestDto dto)
        {
            var result = _debitService.MarkDeliveryFailedByAdmin(dto.DebitId, dto.Note);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}