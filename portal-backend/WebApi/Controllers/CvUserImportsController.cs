using Business.Repository.CvUserImportRepository;
using Entities.DTOs.CvUserImportDtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CvUserImportsController : ControllerBase
    {
        private readonly ICvUserImportService _cvUserImportService;

        public CvUserImportsController(ICvUserImportService cvUserImportService)
        {
            _cvUserImportService = cvUserImportService;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> Upload()
        {
            var result = await _cvUserImportService.UploadAsync(Request.Form.Files);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("batch/{batchId}")]
        public IActionResult GetBatch(long batchId)
        {
            var result = _cvUserImportService.GetBatch(batchId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("mine")]
        public IActionResult GetMine()
        {
            var result = _cvUserImportService.GetMine();
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("create-users")]
        public async Task<IActionResult> CreateUsers([FromBody] CreateUsersFromCvImportDto createUsersDto)
        {
            var result = await _cvUserImportService.CreateUsersAsync(createUsersDto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("delete-items")]
        public IActionResult DeleteItems([FromBody] DeleteCvUserImportItemsDto deleteItemsDto)
        {
            var result = _cvUserImportService.DeleteItems(deleteItemsDto);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
