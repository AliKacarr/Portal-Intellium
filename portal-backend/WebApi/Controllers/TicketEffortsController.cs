using Business.Repository.TicketEffortRepository;
using Entities.DTOs.TicketEffortDtos;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TicketEffortsController : ControllerBase
    {
        private readonly ITicketEffortService _ticketEffortService;

        public TicketEffortsController(ITicketEffortService ticketEffortService)
        {
            _ticketEffortService = ticketEffortService;
        }


        [HttpGet("getallbyticketid")]
        public IActionResult GetAllByTicketId(long ticketId)
        {
            var result = _ticketEffortService.GetAllByTicketId(ticketId);
            return Ok(result);
        }

        [HttpPost("add")]
        public IActionResult Add(AddTicketEffortDto addTicketEffortDto)
        {
            var result = _ticketEffortService.Add(addTicketEffortDto);
            return Ok(result);
        }

        [HttpDelete("delete")]
        public IActionResult Delete(long ticketEffortId)
        {
            var result = _ticketEffortService.Delete(ticketEffortId);
            return Ok(result);
        }
    }
}
