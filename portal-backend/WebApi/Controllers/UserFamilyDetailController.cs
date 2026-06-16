using Business.Repository.UserFamilyDetailRepository;
using Entities.Concrete;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserFamilyDetailController : ControllerBase
    {
        private readonly IUserFamilyDetailService _userFamilyDetailService;

        public UserFamilyDetailController(IUserFamilyDetailService userFamilyDetailService)
        {
            _userFamilyDetailService = userFamilyDetailService;
        }

        [HttpPost("add")]
        public IActionResult Add(UserFamilyDetail userFamilyDetail)
        {
            var result = _userFamilyDetailService.Add(userFamilyDetail);
            return result.Success ? Ok(result) : BadRequest(result.Message);
        }
        [HttpGet("getByUserId")]
        public IActionResult GetById(int id)
        {
            var result = _userFamilyDetailService.GetUserFamilyDetailsByUserId(id);
            return Ok(result);
        }
        
        [HttpDelete("delete")]
        public IActionResult Delete(long id)
        {
            var result = _userFamilyDetailService.Delete(id);
            return result.Success ? Ok(result) : BadRequest(result.Message);
        }
        [HttpPut("update")]
        public IActionResult Update(UserFamilyDetail userFamilyDetail)
        {
            var result = _userFamilyDetailService.Update(userFamilyDetail);
            return result.Success ? Ok(result) : BadRequest(result.Message);
        }
    }
}
