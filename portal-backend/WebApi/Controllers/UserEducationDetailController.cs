using Business.Repository.UserEducationDetailRepository;
using Entities.Concrete;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserEducationDetailController : ControllerBase
    {
        private readonly IUserEducationDetailService _userEducationDetailService;

        public UserEducationDetailController(IUserEducationDetailService userEducationDetailService)
        {
            _userEducationDetailService = userEducationDetailService;
        }

        [HttpPost("add")]
        public IActionResult Add(UserEducationDetail userEducationDetail)
        {
            var result = _userEducationDetailService.Add(userEducationDetail);
            return result.Success ? Ok(result) : BadRequest(result.Message);
        }
        [HttpGet("getByUserId")]
        public IActionResult GetById(int id)
        {
            var result = _userEducationDetailService.GetUserEducationDetailsByUserId(id);
            return Ok(result);
        }
        
        [HttpDelete("delete")]
        public IActionResult Delete(long id)
        {
            var result = _userEducationDetailService.Delete(id);
            return result.Success ? Ok(result) : BadRequest(result.Message);
        }
        [HttpPut("update")]
        public IActionResult Update(UserEducationDetail userEducationDetail)
        {
            var result = _userEducationDetailService.Update(userEducationDetail);
            return result.Success ? Ok(result) : BadRequest(result.Message);
        }
    }
}
