using Business.Repository.EmergencyContactRepository;
using DataAccess.Repository.EmergencyContactRepository;
using Entities.DTOs.EmergencyContactDtos;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    [Route("api/[Controller]")]
    [ApiController]
    public class EmergencyContactController : Controller
    { 
        private readonly IEmergencyContactService _emergencyContactService;

        public EmergencyContactController(IEmergencyContactService emergencyContactService)
        {
            _emergencyContactService = emergencyContactService;
        }

        [HttpPost("add")]
        public IActionResult Add([FromBody] AddEmergencyContactDto addEmergencyContactDto)
        {
            var result = _emergencyContactService.Add(addEmergencyContactDto);
            return (result.Success) ? Ok(result) : BadRequest(result);
        }

        [HttpDelete("delete")]
        public IActionResult Delete(long id)
        {
            var result = _emergencyContactService.Delete(id);
            return (result.Success) ? Ok(result) : BadRequest(result);
        }

        [HttpPut("update")]
        public IActionResult Update([FromBody] UpdateEmergencyContactDto updateEmergencyContactDto)
        {
            var result = _emergencyContactService.Update(updateEmergencyContactDto);
            return (result.Success) ? Ok(result) : BadRequest(result);
        }

        [HttpPut("change")]
        public IActionResult PrimaryChange(long id)
        {
            var result = _emergencyContactService.PrimaryChange(id);
            return (result.Success) ? Ok(result) : BadRequest(result);
        }

        [HttpGet("GetAllByUserId")]
        public IActionResult GetAllById(long id) {
            var result = _emergencyContactService.GetAllById(id);
            return (result.Success) ? Ok(result) : BadRequest(result);
        }
    }
}
