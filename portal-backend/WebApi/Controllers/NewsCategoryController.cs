using Business.Repository.NewsCategoryRepository;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NewsCategoryController : ControllerBase
    {
        private readonly INewsCategoryService _newsCategoryService;

        public NewsCategoryController(INewsCategoryService newsCategoryService)
        {
            _newsCategoryService = newsCategoryService;
        }

        [HttpGet("getAll")]
        public IActionResult GetAll()
        {
            var result = _newsCategoryService.GetAll();
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("getById")]
        public IActionResult GetById([FromQuery] long id)
        {
            var result = _newsCategoryService.GetById(id);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("add")]
        public IActionResult Add([FromQuery] string name, [FromQuery] string? description = null)
        {
            var result = _newsCategoryService.Add(name, description);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPut("update")]
        public IActionResult Update([FromQuery] long id, [FromQuery] string name, [FromQuery] string? description = null)
        {
            var result = _newsCategoryService.Update(id, name, description);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpDelete("delete")]
        public IActionResult Delete([FromQuery] long id)
        {
            var result = _newsCategoryService.Delete(id);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
