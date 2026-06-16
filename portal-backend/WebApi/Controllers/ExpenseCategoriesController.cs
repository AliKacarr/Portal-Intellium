using Business.Repository.ExpenseCategoryRepository;
using Business.Repository.ExpenseCategoryRepository.Constants;
using Entities.DTOs.ExpenseCategoryDto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    /// <summary>
    /// Masraf kategorileri API - GET tüm kullanıcılar, POST/PUT/DELETE sadece admin.
    /// </summary>
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ExpenseCategoriesController : ControllerBase
    {
        private readonly IExpenseCategoryService _expenseCategoryService;

        public ExpenseCategoriesController(IExpenseCategoryService expenseCategoryService)
        {
            _expenseCategoryService = expenseCategoryService;
        }

        /// <summary>Tüm giriş yapmış kullanıcılar erişebilir.</summary>
        [HttpGet]
        public IActionResult GetAll()
        {
            var result = _expenseCategoryService.GetAll();
            return result.Success ? Ok(result.Data) : BadRequest(result.Message);
        }

        /// <summary>Sadece admin. Özel kategori ekler (system: false).</summary>
        [HttpPost]
        public IActionResult Post([FromBody] AddExpenseCategoryDto dto)
        {
            var result = _expenseCategoryService.Add(dto);
            return result.Success ? Ok(result) : BadRequest(new { message = result.Message ?? "Kategori adı boş olamaz.", errors = Array.Empty<string>() });
        }

        /// <summary>Sadece admin. Görünürlük veya ad günceller. Sistem kategorilerde visible değiştirilemez.</summary>
        [HttpPut("{id}")]
        public IActionResult Put(int id, [FromBody] UpdateExpenseCategoryDto dto)
        {
            var result = _expenseCategoryService.Update(id, dto);
            if (result.Success) return Ok(result);
            if (result.Message == ExpenseCategoryMessages.CategoryNotFound)
                return NotFound(new { message = result.Message, errors = Array.Empty<string>() });
            return BadRequest(new { message = result.Message, errors = Array.Empty<string>() });
        }

        /// <summary>Sadece admin. Sadece system: false (özel) kategoriler silinebilir.</summary>
        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var result = _expenseCategoryService.Delete(id);
            if (result.Success) return Ok(result);
            if (result.Message == ExpenseCategoryMessages.CategoryNotFound)
                return NotFound(new { message = result.Message, errors = Array.Empty<string>() });
            return BadRequest(new { message = result.Message, errors = Array.Empty<string>() });
        }
    }
}
