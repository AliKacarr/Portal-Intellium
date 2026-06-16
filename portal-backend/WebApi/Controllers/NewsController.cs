using Business.File;
using Business.Repository.NewsCommentRepository;
using Business.Repository.NewsRepository;
using Entities.DTOs.NewsCommentDtos;
using Entities.DTOs.NewsDtos;
using Microsoft.AspNetCore.Mvc;
using WebApi.Models;

namespace WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NewsController : ControllerBase
    {
        private readonly INewsService _newsService;
        private readonly INewsCommentService _newsCommentService;
        private readonly IFileService _fileService;

        public NewsController(
            INewsService newsService,
            INewsCommentService newsCommentService,
            IFileService fileService)
        {
            _newsService = newsService;
            _newsCommentService = newsCommentService;
            _fileService = fileService;
        }

        /// <summary>
        /// Tüm haberler.
        /// publishedOnly=true: son kullanıcı akışı; taslaklar ve zamanı gelmemiş planlı haberler dönmez.
        /// publishedOnly=false: admin akışı; taslak ve planlı haberler düzenleme için döner.
        /// </summary>
        [HttpGet("getAll")]
        public IActionResult GetAll([FromQuery] bool publishedOnly = true)
        {
            var result = _newsService.GetAll(publishedOnly);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("getById")]
        public IActionResult GetById([FromQuery] long id, [FromQuery] bool skipIncrement = false)
        {
            var result = _newsService.GetById(id);
            if (!result.Success) return BadRequest(result);
            if (!skipIncrement)
                _newsService.IncrementViewCount(id);
            return Ok(result);
        }

        [HttpGet("getByDepartment")]
        public IActionResult GetByDepartment([FromQuery] long departmentId)
        {
            var result = _newsService.GetByDepartment(departmentId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("add")]
        public IActionResult Add([FromBody] AddNewsDto dto)
        {
            var result = _newsService.Add(dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Yeni haber (multipart). Yerel görsel: ImageFile. İsteğe bağlı ImageUrl; dosya varsa kaydedilen yol kullanılır.
        /// </summary>
        [HttpPost("addForm")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> AddForm([FromForm] AddNewsFormRequest req)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.Title) || string.IsNullOrWhiteSpace(req.Content))
                return BadRequest(new { success = false, message = "Başlık ve içerik zorunludur." });

            string? imageUrl = string.IsNullOrWhiteSpace(req.ImageUrl) ? null : req.ImageUrl.Trim();
            if (req.ImageFile != null && req.ImageFile.Length > 0)
            {
                var ext = Path.GetExtension(req.ImageFile.FileName).ToLowerInvariant();
                var allowed = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
                if (!allowed.Contains(ext))
                    return BadRequest(new { success = false, message = "Desteklenmeyen görsel türü." });
                if (req.ImageFile.Length > 5 * 1024 * 1024)
                    return BadRequest(new { success = false, message = "Görsel en fazla 5 MB olabilir." });

                var save = await _fileService.Save(req.ImageFile, FileType.NEWS_COVER);
                if (!save.Success || save.Data == null)
                    return BadRequest(new { success = false, message = save.Message ?? "Görsel kaydedilemedi." });
                imageUrl = save.Data.FilePath;
            }

            var dto = new AddNewsDto
            {
                Title = req.Title.Trim(),
                Content = req.Content.Trim(),
                ImageUrl = imageUrl,
                PublishDate = req.PublishDate,
                IsPublished = req.IsPublished,
                IsCommentable = req.IsCommentable,
                IsGeneral = req.IsGeneral,
                Tags = string.IsNullOrWhiteSpace(req.Tags) ? null : req.Tags.Trim(),
                DepartmentId = req.DepartmentId,
                ServiceArea = string.IsNullOrWhiteSpace(req.ServiceArea) ? null : req.ServiceArea.Trim(),
                NewsCategoryId = req.NewsCategoryId
            };

            var result = _newsService.Add(dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPut("update")]
        public IActionResult Update([FromBody] UpdateNewsDto dto)
        {
            var result = _newsService.Update(dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Haber güncelleme (multipart). Yerel görsel: ImageFile. Dosya yoksa ImageUrl (metin) kullanılır.
        /// </summary>
        [HttpPut("updateForm")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UpdateForm([FromForm] UpdateNewsFormRequest req)
        {
            if (req == null || req.Id <= 0)
                return BadRequest(new { success = false, message = "Geçerli haber kimliği gerekli." });
            if (string.IsNullOrWhiteSpace(req.Title) || string.IsNullOrWhiteSpace(req.Content))
                return BadRequest(new { success = false, message = "Başlık ve içerik zorunludur." });

            string? imageUrl = string.IsNullOrWhiteSpace(req.ImageUrl) ? null : req.ImageUrl.Trim();
            if (req.ImageFile != null && req.ImageFile.Length > 0)
            {
                var ext = Path.GetExtension(req.ImageFile.FileName).ToLowerInvariant();
                var allowed = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
                if (!allowed.Contains(ext))
                    return BadRequest(new { success = false, message = "Desteklenmeyen görsel türü." });
                if (req.ImageFile.Length > 5 * 1024 * 1024)
                    return BadRequest(new { success = false, message = "Görsel en fazla 5 MB olabilir." });

                var save = await _fileService.Save(req.ImageFile, FileType.NEWS_COVER);
                if (!save.Success || save.Data == null)
                    return BadRequest(new { success = false, message = save.Message ?? "Görsel kaydedilemedi." });
                imageUrl = save.Data.FilePath;
            }

            var dto = new UpdateNewsDto
            {
                Id = req.Id,
                Title = req.Title.Trim(),
                Content = req.Content.Trim(),
                ImageUrl = imageUrl,
                PublishDate = req.PublishDate,
                IsPublished = req.IsPublished,
                IsCommentable = req.IsCommentable,
                IsGeneral = req.IsGeneral,
                Tags = string.IsNullOrWhiteSpace(req.Tags) ? null : req.Tags.Trim(),
                DepartmentId = req.DepartmentId,
                ServiceArea = string.IsNullOrWhiteSpace(req.ServiceArea) ? null : req.ServiceArea.Trim(),
                NewsCategoryId = req.NewsCategoryId
            };

            var result = _newsService.Update(dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpDelete("delete")]
        public IActionResult Delete([FromQuery] long id)
        {
            var result = _newsService.Delete(id);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("viewers")]
        public IActionResult GetViewers([FromQuery] long id)
        {
            var result = _newsService.GetViewers(id);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // --- Yorum Endpoint'leri ---

        [HttpGet("comments/getByNews")]
        public IActionResult GetComments([FromQuery] long newsId)
        {
            var result = _newsCommentService.GetByNewsId(newsId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("comments/add")]
        public IActionResult AddComment([FromBody] AddNewsCommentDto dto)
        {
            var result = _newsCommentService.Add(dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpDelete("comments/delete")]
        public IActionResult DeleteComment([FromQuery] long id)
        {
            var result = _newsCommentService.Delete(id);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
