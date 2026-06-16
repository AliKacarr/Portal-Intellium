using Business.Repository.AnnouncementRepository;
using Entities.DTOs.AnnouncementDtos;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AnnouncementController : ControllerBase
    {
        private readonly IAnnouncementService _announcementService;

        public AnnouncementController(IAnnouncementService announcementService)
        {
            _announcementService = announcementService;
        }

        /// <summary>Tüm duyurular (admin/worker için). Soft-deleted kayıtlar gösterilmez.</summary>
        [HttpGet("getAll")]
        public IActionResult GetAll()
        {
            var result = _announcementService.GetAll();
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("getById")]
        public IActionResult GetById([FromQuery] long id)
        {
            var result = _announcementService.GetById(id);
            if (!result.Success) return BadRequest(result);
            _announcementService.IncrementViewCount(id);
            return Ok(result);
        }

        /// <summary>Oturumdaki kullanıcının iş bölümüne göre görebileceği aktif duyurular (süresi dolmamış).</summary>
        [HttpGet("getActive")]
        public IActionResult GetActive()
        {
            var result = _announcementService.GetActiveForCurrentUser();
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("add")]
        public IActionResult Add([FromBody] AddAnnouncementDto dto)
        {
            var result = _announcementService.Add(dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPut("update")]
        public IActionResult Update([FromBody] UpdateAnnouncementDto dto)
        {
            var result = _announcementService.Update(dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>Soft delete — fiziksel silme yapılmaz (IsActive = false).</summary>
        [HttpDelete("delete")]
        public IActionResult Delete([FromQuery] long id)
        {
            var result = _announcementService.Delete(id);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("viewers")]
        public IActionResult GetViewers([FromQuery] long id)
        {
            var result = _announcementService.GetViewers(id);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
