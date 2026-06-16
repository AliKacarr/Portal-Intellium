using Business.Repository.HealthInfoRepository;
using Entities.DTOs.HealthInfoDtos;
using Microsoft.AspNetCore.Mvc;
// using Microsoft.AspNetCore.Authorization; // Gerekebilir

namespace WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    // KANKAM ÖNEMLİ NOT: Eğer globalde [Authorize] yoksa,
    // bu controller'ın 'User' nesnesinin dolu gelmesi için buraya [Authorize] eklemen lazım.
    // Yoksa 'User' boş gelir ve IsAdmin("admin") kontrolü hep false döner.
    // [Authorize] 
    public class HealthInfosController : ControllerBase
    {
        private readonly IHealthInfoService _healthInfoService;

        public HealthInfosController(IHealthInfoService healthInfoService)
        {
            _healthInfoService = healthInfoService;
        }

        // Tüm kayıtları getir (Liste sayfası için)
        [HttpGet("getall")]
        public IActionResult GetAll()
        {
            // GÜNCELLENDİ: Servise 'User' (ClaimsPrincipal) gönderiliyor
            var result = _healthInfoService.GetAllWithUser(User); 
            return Ok(result);
        }

        // Tek bir kaydı getir (Düzenleme sayfası için)
        [HttpGet("getbyidwithuser")]
        public IActionResult GetByIdWithUser(long id)
        {
            // GÜNCELLENDİ: Servise 'User' (ClaimsPrincipal) gönderiliyor
            var result = _healthInfoService.GetWithUserById(id, User);
            return result.Success ? Ok(result) : NotFound(result); // Kayıt yoksa 404
        }

        // Belirli bir kullanıcının kayıtlarını getir
        [HttpGet("getallbyuserid")]
        public IActionResult GetAllByUserId(long userId)
        {
            // Bu metodun imzası değişmemişti (User istemiyordu)
            var result = _healthInfoService.GetAllByUserId(userId);
            return Ok(result);
        }

        // Yeni kayıt ekle (Dosya ile birlikte)
        [HttpPost("add")]
        public IActionResult Add([FromForm] AddHealthInfoDto healthInfoAddDto) // [FromForm] kalmalı
        {
            // GÜNCELLENDİ: Servise 'User' (ClaimsPrincipal) gönderiliyor
            var result = _healthInfoService.Add(healthInfoAddDto, User);
            return result.Success ? Ok(result) : BadRequest(result); // Hata varsa 400
        }

        // Kayıt sil (Dosyayı da siler)
        [HttpDelete("delete")]
        public IActionResult Delete(long id)
        {
            // Bu metodun imzası değişmemişti (User istemiyordu)
            var result = _healthInfoService.Delete(id);
            return result.Success ? Ok(result) : NotFound(result); // Kayıt yoksa 404
        }

        // Kayıt güncelle (Dosya güncelleme dahil)
        [HttpPut("update")]
        public IActionResult Update([FromForm] UpdateHealthInfoDto healthInfoUpdateDto) // [FromForm] kalmalı
        {
            // GÜNCELLENDİ: Servise 'User' (ClaimsPrincipal) gönderiliyor
            var result = _healthInfoService.Update(healthInfoUpdateDto, User);
            return result.Success ? Ok(result) : BadRequest(result); // Hata varsa 400
        }
    }
}