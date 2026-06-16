using Business.Repository.DebitRequestRepository;
using Core.Identity;
using Entities.Concrete;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System; // DateTime için gerekli

namespace WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DebitRequestController : ControllerBase
    {
        private readonly IDebitRequestService _debitRequestService;

        public DebitRequestController(IDebitRequestService debitRequestService)
        {
            _debitRequestService = debitRequestService;
        }

        [HttpPost("add")]
        public IActionResult Add(DebitRequest debitRequest)
        {
            var result = _debitRequestService.Add(debitRequest);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("getall")]
        public IActionResult GetAll()
        {
            var result = _debitRequestService.GetAllDto();
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // ✅ DÜZELTİLDİ: Artık direkt servisteki Reject metodunu çağırıyor (Bildirimli)
        [HttpPost("reject")]
        public IActionResult Reject(int id)
        {
            var result = _debitRequestService.Reject(id);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }

        // ✅ DÜZELTİLDİ: Artık direkt servisteki Complete metodunu çağırıyor (Bildirimli)
        [HttpPost("complete")]
        public IActionResult Complete(int id)
        {
            var result = _debitRequestService.Complete(id);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }

        [HttpPost("update-my-request")]
        public IActionResult UpdateMyRequest(DebitRequest debitRequest)
        {
            var existingReqResult = _debitRequestService.GetById(debitRequest.Id);
            if (!existingReqResult.Success || existingReqResult.Data == null)
            {
                return BadRequest("Talep bulunamadı.");
            }

            var existingReq = existingReqResult.Data;

            if (existingReq.Status != "Bekliyor")
            {
                return BadRequest("Bu talep işleme alındığı için güncellenemez.");
            }

            existingReq.ProductId = debitRequest.ProductId;
            existingReq.RequestedCategory = debitRequest.RequestedCategory;
            existingReq.RequestedBrand = debitRequest.RequestedBrand;
            existingReq.RequestedModel = debitRequest.RequestedModel;
            // Category, serviste ProductId üzerinden dolduruluyor (backward uyumluluk)
            existingReq.Category = debitRequest.Category;
            existingReq.Description = debitRequest.Description;
            existingReq.RequestDate = DateTime.Now; 

            var result = _debitRequestService.Update(existingReq);
            if (result.Success) return Ok(result);
            return BadRequest(result);
        }

        public class AdminAttachProductRequest
        {
            public int RequestId { get; set; }
            public int ProductId { get; set; }
        }

        /// <summary>
        /// Admin: "Stoğa Ekle" sonrası, talebi yeni eklenen ürünle ilişkilendirir.
        /// </summary>
        [Authorize(Roles = RoleNames.Admin)]
        [HttpPost("admin-attach-product")]
        public IActionResult AdminAttachProduct([FromBody] AdminAttachProductRequest req)
        {
            if (req == null || req.RequestId <= 0 || req.ProductId <= 0)
            {
                return BadRequest("Geçersiz istek.");
            }

            var existingReqResult = _debitRequestService.GetById(req.RequestId);
            if (!existingReqResult.Success || existingReqResult.Data == null)
            {
                return BadRequest("Talep bulunamadı.");
            }

            var existingReq = existingReqResult.Data;
            existingReq.ProductId = req.ProductId;
            existingReq.RequestedCategory = null;
            existingReq.RequestedBrand = null;
            existingReq.RequestedModel = null;
            existingReq.RequestDate = DateTime.Now;

            var updateResult = _debitRequestService.Update(existingReq);
            return updateResult.Success ? Ok(updateResult) : BadRequest(updateResult);
        }
    }
}