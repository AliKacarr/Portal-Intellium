using Business.Repository.AiTaskPreviewRepository;
using Business.Helpers;
using Entities.DTOs.AiTaskPreviewDtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AiTaskPreviewsController : ControllerBase
    {
        private const string ServiceClientName = "PortalMeet";
        private const string ServiceKeyHeaderName = "X-Service-Key";
        private readonly IAiTaskPreviewService _aiTaskPreviewService;
        private readonly IServiceKeyValidator _serviceKeyValidator;

        public AiTaskPreviewsController(IAiTaskPreviewService aiTaskPreviewService, IServiceKeyValidator serviceKeyValidator)
        {
            _aiTaskPreviewService = aiTaskPreviewService;
            _serviceKeyValidator = serviceKeyValidator;
        }

        [AllowAnonymous]
        [HttpPost("import")]
        public IActionResult Import([FromBody] ImportAiTaskPreviewsDto importAiTaskPreviewsDto)
        {
            if (!HasValidServiceKey())
                return Unauthorized("Geçersiz servis anahtarı.");

            var result = _aiTaskPreviewService.Import(importAiTaskPreviewsDto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("getmine")]
        public IActionResult GetMine()
        {
            var result = _aiTaskPreviewService.GetMine();
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPut("update")]
        public IActionResult Update([FromBody] UpdateAiTaskPreviewDto updateAiTaskPreviewDto)
        {
            var result = _aiTaskPreviewService.Update(updateAiTaskPreviewDto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("approve")]
        public IActionResult Approve([FromBody] ApproveAiTaskPreviewsDto approveAiTaskPreviewsDto)
        {
            var result = _aiTaskPreviewService.Approve(approveAiTaskPreviewsDto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("reject")]
        public IActionResult Reject([FromBody] RejectAiTaskPreviewsDto rejectAiTaskPreviewsDto)
        {
            var result = _aiTaskPreviewService.Reject(rejectAiTaskPreviewsDto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        private bool HasValidServiceKey()
        {
            var serviceKey = Request.Headers[ServiceKeyHeaderName].FirstOrDefault();
            return _serviceKeyValidator.IsValid(ServiceClientName, serviceKey);
        }
    }
}
