using Business.Repository.LogRepository;
using Entities.DTOs.LogDtos;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class SessionsController : ControllerBase
	{
		private readonly ISessionService _sessionService;

		public SessionsController(ISessionService sessionService)
		{
			_sessionService = sessionService;
		}

		[HttpPost("GetFilteredSessions")]
		public async Task<ActionResult<IResult>> GetFilteredSessions([FromBody] SessionFilterDto filterDto)
		{
			var result = await _sessionService.GetFilteredSessionsAsync(filterDto);
			return result.Success ? Ok(result) : BadRequest(result);
		}

		[HttpGet("GetAllSessions")]
		public ActionResult GetAllSessions()
		{
			var result = _sessionService.GetAllSession();
			return (result.Success) ? Ok(result) : BadRequest(result);
		}

		[HttpGet("GetSessionsByUserId")]
		public ActionResult GetSessionsByUserId(long userID)
		{
			var result = _sessionService.GetSessionsByUserId(userID);
			return (result.Success) ? Ok(result) : BadRequest(result);

		}
		[HttpGet("GetNotVerifiedSessions")]
		public ActionResult GetNotVerifiedSessions()
		{
			var result = _sessionService.GetNotVerifiedSession();
			return (result.Success) ? Ok(result) : BadRequest(result);
		}

		[HttpGet("GetAllFailLoginByUserId")]
		public ActionResult GetAllFailLoginByUserId(long userID)
		{
			var result = _sessionService.GetAllFailLoginByUserId(userID);
			return (result.Success) ? Ok(result) : BadRequest(result);
		}
	}
}
