using Business.Repository.TicketCommentRepository;
using Entities.DTOs.TicketCommentDtos;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TicketCommentController : ControllerBase
    {
        private readonly ITicketCommentService _ticketCommentService;

        public TicketCommentController(ITicketCommentService ticketCommentService)
        {
            _ticketCommentService = ticketCommentService;
        }
        [HttpPost("add")]
        public IActionResult Add(AddTicketCommentDto addTicketComment)
        {
            var result = _ticketCommentService.Add(addTicketComment);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result);

        }

        [HttpPut("update")]
        public IActionResult Update(EditTicketCommentDto editTicketComment)
        {
            var result = _ticketCommentService.Update(editTicketComment);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }

        [HttpDelete("delete")]
        public IActionResult Delete(long ticketCommentId)
        {
            var result = _ticketCommentService.Delete(ticketCommentId);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }


        [HttpGet("getAllByTicket")]
        public IActionResult GetList(long ticketId)
        {
            var result = _ticketCommentService.GetAllByTicketId(ticketId);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }
    }
}
