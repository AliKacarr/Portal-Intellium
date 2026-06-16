using Business.Repository.ProductRepository;
using Entities.Concrete;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    [Route("api/product")]
    [ApiController]
    public class ProductController : ControllerBase
    {
        private readonly IProductService _productService;

        public ProductController(IProductService productService)
        {
            _productService = productService;
        }

        [HttpPost("add")]
        public IActionResult Add(Product product)
        {
            var result = _productService.Add(product);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPut("update")]
        public IActionResult Update(Product product)
        {
            var result = _productService.Update(product);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("delete")]
        public IActionResult Delete(Product product)
        {
            var result = _productService.Delete(product);
            return result.Success ? Ok(result) : BadRequest(result);
        }
        
        // ID ile Silme (Frontend için daha kolay)
        [HttpDelete("{id}")]
        public IActionResult DeleteById(int id)
        {
            var productResult = _productService.GetById(id);
            if (!productResult.Success || productResult.Data == null)
            {
                return NotFound("Silinecek ürün bulunamadı.");
            }

            var result = _productService.Delete(productResult.Data);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("getall")]
        public IActionResult GetAll()
        {
            var result = _productService.GetAll();
            return result.Success ? Ok(result) : BadRequest(result);
        }
        
        [HttpGet("get/{id}")]
        public IActionResult GetById(int id)
        {
            var result = _productService.GetById(id);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}