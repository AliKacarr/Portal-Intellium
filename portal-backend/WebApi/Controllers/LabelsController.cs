using Business.Repository.LabelRepository;
using Entities.Concrete;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LabelsController : ControllerBase
    {
        private readonly ILabelService _labelService;

        public LabelsController(ILabelService labelService)
        {
            _labelService = labelService;
        }

        [HttpGet("getall")]
        public IActionResult GetAll()
        {
            var result = _labelService.GetAll();
            return (result.Success) ? Ok(result) : BadRequest(result);
        }

        [HttpPost("add")]
        public IActionResult Add([FromBody] Label label)
        {
            var result = _labelService.Add(label);
            return (result.Success) ? Ok(result) : BadRequest(result);
        }

        [HttpPut("update")]
        public IActionResult Update([FromBody] Label label)
        {
            var result = _labelService.Update(label);
            return (result.Success) ? Ok(result) : BadRequest(result);
        }

        [HttpDelete("delete")]
        public IActionResult Delete(int labelId)
        {
            var result = _labelService.Delete(labelId);
            return (result.Success) ? Ok(result) : BadRequest(result);
        }
    }
}
