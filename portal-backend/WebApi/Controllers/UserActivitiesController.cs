using Business.Repository.LogRepository;
using Entities.DTOs.LogDtos;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class UserActivitiesController : ControllerBase
	{
		private readonly IUserActivityService _userActivityService;
		public UserActivitiesController(IUserActivityService userActivityService)
		{
			_userActivityService = userActivityService;
		}

		[HttpPost("GetFilteredActivities")]
		public async Task<ActionResult<IResult>> GetFilteredActivities([FromBody] UserActivityFilterDto filterDto)
		{
			var result = await _userActivityService.GetFilteredActivitiesAsync(filterDto);
			return result.Success ? Ok(result) : BadRequest(result);
		}

		[HttpGet("GetAllActivities")]
		public ActionResult GetAllActivities()
		{
			var result = _userActivityService.GetAllActivities();
			return (result.Success) ? Ok(result) : BadRequest(result);
		}

		[HttpGet("GetActivity")]
		public ActionResult GetActivity(long activityID)
		{
			var result = _userActivityService.GetActivity(activityID);
			return (result.Success) ? Ok(result) : BadRequest(result);
		}

		[HttpGet("GetAllActiviesByUserId")]
		public ActionResult GetAllActiviesByUserId(long userID)
		{
			var result = _userActivityService.GetAllActiviesByUserId(userID);
			return (result.Success) ? Ok(result) : BadRequest(result);
		}
		[HttpGet("GetAllSuccessActivitiesByUserID")]
		public ActionResult GetAllSuccessActivitiesByUserID(long userID)
		{
			var result = _userActivityService.GetAllSuccessActivitiesByUserID(userID);
			return (result.Success) ? Ok(result) : BadRequest(result);
		}

		[HttpGet("GetAllFailActivitiesByUserID")]
		public ActionResult GetAllFailActivitiesByUserID(long userID)
		{
			var result = _userActivityService.GetAllFailActivitiesByUserID(userID);
			return (result.Success) ? Ok(result) : BadRequest(result);

		}

		[HttpGet("GetUnauthorizedActivities")]
		public ActionResult GetUnauthorizedActivities()
		{
			var result = _userActivityService.GetUnauthorizedActivities();
			return (result.Success) ? Ok(result) : BadRequest(result);
		}

		[HttpGet("GetForbiddenActivities")]
		public ActionResult GetForbiddenActivities()
		{
			var result = _userActivityService.GetForbiddenActivities();
			return (result.Success) ? Ok(result) : BadRequest(result);
		}

	}
}
