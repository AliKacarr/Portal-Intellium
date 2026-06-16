using Business.Repository.PollRepository;
using Entities.DTOs.PollDtos;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PollController : ControllerBase
    {
        private readonly IPollService _pollService;

        public PollController(IPollService pollService)
        {
            _pollService = pollService;
        }

        [HttpGet("getAll")]
        public IActionResult GetAll()
        {
            var result = _pollService.GetAll();
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("getActive")]
        public IActionResult GetActive()
        {
            var result = _pollService.GetActive();
            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>Anket detayı ile seçenek oy sayıları ve kullanıcının oy durumu.</summary>
        [HttpGet("getById")]
        public IActionResult GetById([FromQuery] long id)
        {
            var result = _pollService.GetById(id);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>Yeni anket oluştur. Options: en az 2 seçenek.</summary>
        [HttpPost("add")]
        public IActionResult Add([FromBody] AddPollDto dto)
        {
            var result = _pollService.Add(dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("update")]
        public IActionResult Update([FromBody] UpdatePollDto dto)
        {
            var result = _pollService.Update(dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>Oy kullan. Her kullanıcı bir ankete yalnızca bir kez oy verebilir.</summary>
        [HttpPost("vote")]
        public IActionResult Vote([FromBody] VotePollDto dto)
        {
            var result = _pollService.Vote(dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpDelete("delete")]
        public IActionResult Delete([FromQuery] long id)
        {
            var result = _pollService.Delete(id);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
