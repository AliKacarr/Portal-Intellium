using Business.Repository.UserJobDetailsRepository;
using Entities.Concrete;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserJobDetailController : ControllerBase
    {
        private readonly IUserJobDetailService _userJobDetailService;

        public UserJobDetailController(IUserJobDetailService userJobDetailService)
        {
            _userJobDetailService = userJobDetailService;
        }

        [HttpPost("add")]
        public IActionResult Add(UserJobDetail userJobDetail)
        {
            var result = _userJobDetailService.Add(userJobDetail);
            return result.Success ? Ok(result) : BadRequest(result.Message);
        }
        [HttpGet("getByUserId")]
        public IActionResult GetById(int id)
        {
            var result = _userJobDetailService.GetByUserIdForBusiness(id);
            return Ok(result);
        }

        [HttpGet("me")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public IActionResult GetMine()
        {
            var raw = User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!long.TryParse(raw, out var userId))
                return Unauthorized();

            var result = _userJobDetailService.GetByUserIdForBusiness(userId);
            return Ok(result);
        }
        
        [HttpDelete("delete")]
        public IActionResult Delete(long id)
        {
            var result = _userJobDetailService.Delete(id);
            return result.Success ? Ok(result) : BadRequest(result.Message);
        }
        [HttpPut("update")]
        public IActionResult Update(UserJobDetail userJobDetail)
        {
            var result = _userJobDetailService.Update(userJobDetail);
            return result.Success ? Ok(result) : BadRequest(result.Message);
        }
    }
}
