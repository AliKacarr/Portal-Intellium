using Business.Repository.DepartmentRepository;
using Entities.DTOs.DepartmentDtos;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DepartmentController : ControllerBase
    {
        private readonly IDepartmentService _departmentService;

        public DepartmentController(IDepartmentService departmentService)
        {
            _departmentService = departmentService;
        }

        [HttpGet("getAll")]
        public IActionResult GetAll()
        {
            var result = _departmentService.GetAll();
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("getById")]
        public IActionResult GetById([FromQuery] long id)
        {
            var result = _departmentService.GetById(id);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("add")]
        public IActionResult Add([FromBody] AddDepartmentDto dto)
        {
            var result = _departmentService.Add(dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPut("update")]
        public IActionResult Update([FromBody] UpdateDepartmentDto dto)
        {
            var result = _departmentService.Update(dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpDelete("delete")]
        public IActionResult Delete([FromQuery] long id)
        {
            var result = _departmentService.Delete(id);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
