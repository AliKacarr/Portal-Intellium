using Business.Repository.ProjectTypeRepository;
using Entities.Concrete;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProjectTypeController : ControllerBase
    {
        private readonly IProjectTypeService _projectTypeService;

        public ProjectTypeController(IProjectTypeService projectTypeService)
        {
            _projectTypeService = projectTypeService;
        }
        [HttpPost("add")]
        public IActionResult Add(ProjectType projectType)
        {
            var result = _projectTypeService.Add(projectType);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result.Message);
        }
        [HttpPut("update")]
        public IActionResult Update(ProjectType projectType)
        {
            var result = _projectTypeService.Update(projectType);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result.Message);
        }
        [HttpDelete("delete")]
        public IActionResult Delete(long id)
        {
            var result = _projectTypeService.Delete(id);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result.Message);
        }
        [HttpGet("getList")]
        public IActionResult GetList()
        {
            var result = _projectTypeService.GetAll();
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result.Message);
        }
        [HttpGet("getById")]
        public IActionResult GetById(long id)
        {
            var result = _projectTypeService.GetById(id);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result.Message);
        }
    }
}
