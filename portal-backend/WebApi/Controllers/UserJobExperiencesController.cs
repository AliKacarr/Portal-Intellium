using Business.Repository.UserJobExperienceRepository;
using Entities.Concrete;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserJobExperiencesController : ControllerBase
    {
        private readonly IUserJobExperienceService _userJobExperienceService;
        public UserJobExperiencesController(IUserJobExperienceService userJobExperienceService)
        {
            _userJobExperienceService = userJobExperienceService;
        }

        [HttpPost("add")]
        public IActionResult Add([FromBody] UserJobExperience userJobExperience)
        {
            var result = _userJobExperienceService.Add(userJobExperience);
            return (result.Success) ? Ok(result) : BadRequest(result);
        }

        [HttpDelete("delete")]
        public IActionResult Delete(long id)
        {
            var result = _userJobExperienceService.Delete(id);
            return (result.Success) ? Ok(result) : BadRequest(result);
        }

        [HttpPut("update")]
        public IActionResult Update([FromBody] UserJobExperience userJobExperience)
        {
            var result = _userJobExperienceService.Update(userJobExperience);
            return (result.Success) ? Ok(result) : BadRequest(result);
        }

        [HttpGet("getAllByUserId")]
        public IActionResult GetAllByUserId(long userId)
        {
            var result = _userJobExperienceService.GetAllByUserId(userId);
            return Ok(result);
        }
    }
}
