using Business.Repository.UserCertificateDetailRepository;
using Entities.Concrete;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserCertificateDetailController : ControllerBase
    {
        private readonly IUserCertificateDetailService _userCertificateDetailService;

        public UserCertificateDetailController(IUserCertificateDetailService userCertificateDetailService)
        {
            _userCertificateDetailService = userCertificateDetailService;
        }

        [HttpPost("add")]
        public IActionResult Add(UserCertificateDetail userCertificateDetail)
        {
            var result = _userCertificateDetailService.Add(userCertificateDetail);
            return result.Success ? Ok(result) : BadRequest(result.Message);
        }
        [HttpGet("getByUserId")]
        public IActionResult GetById(int id)
        {
            var result = _userCertificateDetailService.GetUserCertificateDetailByUserId(id);
            return Ok(result);
        }
        
        [HttpDelete("delete")]
        public IActionResult Delete(long id)
        {
            var result = _userCertificateDetailService.Delete(id);
            return result.Success ? Ok(result) : BadRequest(result.Message);
        }
        [HttpPut("update")]
        public IActionResult Update(UserCertificateDetail userCertificateDetail)
        {
            var result = _userCertificateDetailService.Update(userCertificateDetail);
            return result.Success ? Ok(result) : BadRequest(result.Message);
        }
    }
}
