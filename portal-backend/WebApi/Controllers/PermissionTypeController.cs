using Business.Repository.PermissionTypeRepository;
using Entities.DTOs.PermissionTypeDtos;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PermissionTypeController : ControllerBase
    {
        private readonly IPermissionTypeService _permissionTypeService;

        public PermissionTypeController(IPermissionTypeService permissionTypeService)
        {
            _permissionTypeService = permissionTypeService;
        }

        [HttpPost("add")]
        public IActionResult Add(AddPermissionTypeDto addPermissionTypeDto)
        {
            var result = _permissionTypeService.Add(addPermissionTypeDto);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }

        [HttpPost("update")]
        public IActionResult Update(UpdatePermissionTypeDto updatePermissionTypeDto)
        {
            var result = _permissionTypeService.Update(updatePermissionTypeDto);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }

        // Genellikle Entity ID'si üzerinden silme "Delete" HTTP metodu veya "int" alan bir post ile yapılır.
        [HttpPost("delete")]
        public IActionResult Delete(int id)
        {
            var result = _permissionTypeService.Delete(id);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }

        [HttpGet("getall")]
        public IActionResult GetAll()
        {
            var result = _permissionTypeService.GetAll();
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }

        [HttpGet("getbyid")]
        public IActionResult GetById(int id)
        {
            var result = _permissionTypeService.GetById(id);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }
    }
}
