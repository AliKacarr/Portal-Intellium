using Business.Repository.HolidayRepository;
using Business.Repository.LeaveDeducationRepository;
using Entities.Concrete;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    [Route("api/LeaveDeducation")]
    [ApiController]
    public class LeaveDeducationController : ControllerBase
    {
        private readonly ILeaveDeducationService _leaveDeducationService;

        public LeaveDeducationController(ILeaveDeducationService leaveDeducationService)
        {
            _leaveDeducationService = leaveDeducationService;
        }

        [HttpPost("add")]
        public IActionResult Add(LeaveDeducation leaveDeducation)
        {
            var result = _leaveDeducationService.Add(leaveDeducation);
            return Ok(result);
        }

        [HttpGet("getAll")]
        public IActionResult GetAll()
        {
            var result = _leaveDeducationService.GetAll();
            return result.Success ? Ok(result) : NotFound();
        }

        [HttpPut("update")]
        public IActionResult Update(LeaveDeducation leaveDeducation)
        {
            var result = _leaveDeducationService.Update(leaveDeducation);
            return result.Success ? Ok(result) : BadRequest();
        }

        [HttpDelete("delete")]
        public IActionResult Delete(int id)
        {
            var result = _leaveDeducationService.Delete(id);
            return result.Success ? Ok(result) : NotFound();
        }

        [HttpGet("getByPermissionType")]
        public IActionResult GetByPermissionType(string permissionType)
        {
            var result = _leaveDeducationService.GetByPermissionType(permissionType);
            return result.Success ? Ok(result) : NotFound();
        }
    }
}
