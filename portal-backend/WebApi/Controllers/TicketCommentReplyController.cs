using Business.Repository.CommentReplyRepository;
using Entities.DTOs.TicketCommentReplyDtos;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TicketCommentReplyController : ControllerBase
    {
        private readonly ITicketCommentReplyService _ticketCommentReplyService;

        public TicketCommentReplyController(ITicketCommentReplyService ticketCommentReplyService)
        {
            _ticketCommentReplyService = ticketCommentReplyService;
        }

        [HttpPost("add")]
        public IActionResult Add(AddTicketCommentReplyDto addTicketCommentReply)
        {
            var result = _ticketCommentReplyService.Add(addTicketCommentReply);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result.Message);
        }

        [HttpPut("update")]
        public IActionResult Update(EditTicketCommentReplyDto editTicketCommentReply)
        {
            var result = _ticketCommentReplyService.Update(editTicketCommentReply);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result.Message);
        }

        [HttpDelete("delete")]
        public IActionResult Delete(long commentReplyId)
        {
            var result = _ticketCommentReplyService.Delete(commentReplyId);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result.Message);
        }

    }
}
