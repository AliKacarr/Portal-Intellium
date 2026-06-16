using Business.Repository.TicketAttachmentRepository;
using Entities.DTOs.TicketAttachmentDtos;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TicketAttachmentsController : ControllerBase
    {
        private readonly ITicketAttachmentService _ticketAttachmentService;

        public TicketAttachmentsController(ITicketAttachmentService ticketAttachmentService)
        {
            _ticketAttachmentService = ticketAttachmentService;
        }

        [HttpGet("getallbyticketid")]
        public IActionResult GetAllByTicketId(long ticketId)
        {
            var result = _ticketAttachmentService.GetAllByTicketId(ticketId);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }

        [HttpPost("add")]
        public async Task<IActionResult> Add([FromForm] AddTicketAttachmentDto addTicketAttachmentDto)
        {
            var result = await _ticketAttachmentService.Add(addTicketAttachmentDto);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }

        [HttpDelete("delete")]
        public IActionResult Delete(long ticketAttachmentId)
        {
            var result = _ticketAttachmentService.Delete(ticketAttachmentId);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }
    }
}
