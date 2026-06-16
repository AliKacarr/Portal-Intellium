using Business.Repository.RequestRepository;
using Entities.DTOs.RequestDtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;

namespace WebApi.Controllers
{
    [Route("api/request")]
    [ApiController]
    [Authorize]
    public class RequestController : ControllerBase
    {
        private readonly IRequestService _service;

        public RequestController(IRequestService service)
        {
            _service = service;
        }

        [HttpGet("categories")]
        public IActionResult Categories()
        {
            var res = _service.GetCategories();
            return res.Success ? Ok(res) : BadRequest(res);
        }

        [HttpPost("categories")]
        public IActionResult AddCategory([FromBody] UpsertRequestCategoryDto dto)
        {
            var res = _service.AddCategory(dto);
            return res.Success ? Ok(res) : BadRequest(res);
        }

        [HttpPut("categories/{id}")]
        public IActionResult UpdateCategory([FromRoute] int id, [FromBody] UpsertRequestCategoryDto dto)
        {
            var res = _service.UpdateCategory(id, dto);
            return res.Success ? Ok(res) : BadRequest(res);
        }

        [HttpDelete("categories/{id}")]
        public IActionResult DeleteCategory([FromRoute] int id)
        {
            var res = _service.DeleteCategory(id);
            return res.Success ? Ok(res) : BadRequest(res);
        }

        [HttpPost("sub-categories")]
        public IActionResult AddSubCategory([FromBody] UpsertRequestSubCategoryDto dto)
        {
            var res = _service.AddSubCategory(dto);
            return res.Success ? Ok(res) : BadRequest(res);
        }

        [HttpPut("sub-categories/{id}")]
        public IActionResult UpdateSubCategory([FromRoute] int id, [FromBody] UpsertRequestSubCategoryDto dto)
        {
            var res = _service.UpdateSubCategory(id, dto);
            return res.Success ? Ok(res) : BadRequest(res);
        }

        [HttpDelete("sub-categories/{id}")]
        public IActionResult DeleteSubCategory([FromRoute] int id)
        {
            var res = _service.DeleteSubCategory(id);
            return res.Success ? Ok(res) : BadRequest(res);
        }

        [HttpPost("sub-category-fields")]
        public IActionResult AddSubCategoryField([FromBody] UpsertRequestSubCategoryFieldDto dto)
        {
            var res = _service.AddSubCategoryField(dto);
            return res.Success ? Ok(res) : BadRequest(res);
        }

        [HttpPut("sub-category-fields/{id}")]
        public IActionResult UpdateSubCategoryField([FromRoute] int id, [FromBody] UpsertRequestSubCategoryFieldDto dto)
        {
            var res = _service.UpdateSubCategoryField(id, dto);
            return res.Success ? Ok(res) : BadRequest(res);
        }

        [HttpDelete("sub-category-fields/{id}")]
        public IActionResult DeleteSubCategoryField([FromRoute] int id)
        {
            var res = _service.DeleteSubCategoryField(id);
            return res.Success ? Ok(res) : BadRequest(res);
        }

        [HttpPost("create")]
        [Consumes("application/json", "multipart/form-data")]
        public IActionResult Create([FromBody] CreateRequestDto dto)
        {
            var res = _service.Create(dto);
            return res.Success ? Ok(res) : BadRequest(res);
        }

        [HttpGet("my")]
        public IActionResult My([FromQuery] string? status = null)
        {
            var res = _service.GetMyRequests(status);
            return res.Success ? Ok(res) : BadRequest(res);
        }

        [HttpPatch("my/{id}")]
        public IActionResult UpdateMyDraft([FromRoute] long id, [FromBody] UpdateRequestDto dto)
        {
            var res = _service.UpdateMyDraft(id, dto);
            return res.Success ? Ok(res) : BadRequest(res);
        }

        [HttpGet("{id}")]
        public IActionResult Detail([FromRoute] long id)
        {
            var res = _service.GetMyRequestDetail(id);
            return res.Success ? Ok(res) : BadRequest(res);
        }

        [HttpPost("{id}/attachments")]
        [RequestSizeLimit(15 * 1024 * 1024)]
        public async Task<IActionResult> AddAttachments([FromRoute] long id, [FromForm] List<IFormFile> attachments)
        {
            var res = await _service.AddAttachments(id, attachments);
            return res.Success ? Ok(res) : BadRequest(res);
        }

        [HttpGet("{id}/attachments/{attachmentId}")]
        public IActionResult DownloadAttachment([FromRoute] long id, [FromRoute] long attachmentId)
        {
            var res = _service.DownloadMyAttachment(id, attachmentId);
            if (!res.Success) return BadRequest(res);
            var (bytes, contentType, fileName) = res.Data;
            return File(bytes, contentType, fileName);
        }

        [HttpGet("inbox")]
        public IActionResult Inbox([FromQuery] string? status = null, [FromQuery] int? categoryId = null)
        {
            var res = _service.GetInbox(status, categoryId);
            return res.Success ? Ok(res) : BadRequest(res);
        }

        [HttpPatch("{id}/status")]
        public IActionResult UpdateStatus([FromRoute] long id, [FromBody] UpdateRequestStatusDto dto)
        {
            var res = _service.UpdateStatus(id, dto);
            return res.Success ? Ok(res) : BadRequest(res);
        }

        [HttpPatch("{id}")]
        public IActionResult AdminUpdate([FromRoute] long id, [FromBody] UpdateRequestDto dto)
        {
            var res = _service.AdminUpdate(id, dto);
            return res.Success ? Ok(res) : BadRequest(res);
        }

        [HttpPost("{id}/cancel")]
        public IActionResult Cancel([FromRoute] long id, [FromQuery] string? note = null)
        {
            var res = _service.Cancel(id, note);
            return res.Success ? Ok(res) : BadRequest(res);
        }

        [HttpDelete("my/{id}")]
        public IActionResult DeleteMyDraft([FromRoute] long id)
        {
            var res = _service.DeleteMyDraft(id);
            return res.Success ? Ok(res) : BadRequest(res);
        }

        [HttpDelete("{id}")]
        public IActionResult AdminDelete([FromRoute] long id)
        {
            var res = _service.AdminDelete(id);
            return res.Success ? Ok(res) : BadRequest(res);
        }
    }
}

