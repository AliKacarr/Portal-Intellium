using Business.Repository.LogRepository;
using Entities.DTOs.LogDtos;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class ErrorsController : ControllerBase
	{
		private readonly IErrorService _errorService;
		public ErrorsController(IErrorService errorService)
		{
			_errorService = errorService;
		}
		[HttpPost("GetFilteredErrors")]
		public async Task<ActionResult<IResult>> GetFilteredErrors([FromBody] ErrorFilterDto filterDto)
		{
			var result = await _errorService.GetFilteredErrorsAsync(filterDto);
			return result.Success ? Ok(result) : BadRequest(result);
		}

		[HttpGet("GetAllErrors")]
		public ActionResult GetAllErrors()
		{
			var result = _errorService.GetAllErrors();
			return (result.Success) ? Ok(result) : BadRequest(result);
		}

		[HttpGet("GetAllErrorTypes")]
		public ActionResult GetAllErrorTypes()
		{
			var result = _errorService.GetErrorTypes();
			return (result.Success) ? Ok(result) : BadRequest(result);

		}
		[HttpGet("GetAllByErrorType")]
		public ActionResult GetAllByErrorType(long ErrorTypeID)
		{
			var result = _errorService.GetAllByErrorType(ErrorTypeID);
			return (result.Success) ? Ok(result) : BadRequest(result);
		}
		[HttpGet("GetInternalServerErrors")]
		public ActionResult GetInternalServerErrors()
		{
			var result = _errorService.GetInternalServerError();
			return (result.Success) ? Ok(result) : BadRequest(result);
		}
		[HttpGet("GetStackTrace")]
		public ActionResult GetStackTrace(long stackTraceID)
		{
			var result = _errorService.GetStackTrace(stackTraceID);
			return (result.Success) ? Ok(result) : BadRequest(result);
		}
	}
}
