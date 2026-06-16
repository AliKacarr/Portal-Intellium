using Business.Repository.BoardCategoryRepository;
using Entities.Concrete;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BoardCategoriesController : ControllerBase
    {
        private readonly IBoardCategoryService _boardCategoryService;

        public BoardCategoriesController (IBoardCategoryService boardCategoryService)
        {
            _boardCategoryService = boardCategoryService;
        }

        [HttpGet("getall")]
        public IActionResult GetAll()
        {
            var result = _boardCategoryService.GetAll();
            return (result.Success) ? Ok(result) : BadRequest(result);
        }

        [HttpPost("add")]
        public IActionResult Add([FromBody] BoardCategory boardCategory)
        {
            var result = _boardCategoryService.Add(boardCategory);
            return (result.Success) ? Ok(result) : BadRequest(result);
        }

        [HttpDelete("delete")]
        public IActionResult Delete(int boardCategoryId)
        {
            var result = _boardCategoryService.Delete(boardCategoryId);
            return (result.Success) ? Ok(result) : BadRequest(result);
        }

        [HttpPut("update")]
        public IActionResult Update([FromBody] BoardCategory boardCategory)
        {
            var result = _boardCategoryService.Update(boardCategory);
            return (result.Success) ? Ok(result) : BadRequest(result);
        }
    }
}
