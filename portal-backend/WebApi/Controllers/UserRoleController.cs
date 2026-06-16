using Business.Repository.UserRoleRepository;
using Entities.Concrete;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserRoleController : ControllerBase
    {
        private readonly IUserRoleService _userRoleService;

        public UserRoleController(IUserRoleService userRoleService)
        {
            _userRoleService = userRoleService;
        }

        [HttpPost("add")]
        public IActionResult Add(UserRole userRole)
        {
            var result = _userRoleService.Add(userRole);
            return result.Success ? Ok(result) : BadRequest(result.Message);
        }


        [HttpGet("getAll")]
        public IActionResult GetAll()
        {
            var result = _userRoleService.GetAll();
            return result.Success ? Ok(result) : BadRequest(result.Message);

        }
        [HttpDelete("delete")]
        public IActionResult Delete(long id)
        {
            var result = _userRoleService.Delete(id);
            return result.Success ? Ok(result) : BadRequest(result.Message);

        }
        [HttpPut("update")]
        public IActionResult Update(UserRole userRole)
        {
            var result = _userRoleService.Update(userRole);
            return result.Success ? Ok(result) : BadRequest(result.Message);

        }
    }
}
