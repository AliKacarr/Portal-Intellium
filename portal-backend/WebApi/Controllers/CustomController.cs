using Business.Repository.CustomRepository;
using Entities.Concrete;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CustomController : ControllerBase
    {
        private readonly ICustomService _customService;

        public CustomController(ICustomService customService)
        {
            _customService = customService;
        }

        [HttpPost]
        public IActionResult AddCustom(Custom custom)
        {
            var result = _customService.Add(custom);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet]
        public IActionResult GetCustoms()
        {
            var result = _customService.GetAll();
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPut]
        public IActionResult UpdateCustom(Custom custom)
        {
            var result = _customService.Update(custom);
            return result.Success ? Ok(result) : BadRequest(result);

        }

        [HttpDelete]
        public IActionResult DeleteCustom(int id)
        {
            var result = _customService.Delete(id);
            return result.Success ? Ok(result) : BadRequest(result);

        }
    }
}
