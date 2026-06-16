using Business.Repository.CustomRepository;
using Business.Repository.DaysWorkRepository;
using Entities.Concrete;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DaysWorkController : ControllerBase
    {
        private readonly IDaysWorkService _daysWorkService;
        public DaysWorkController(IDaysWorkService daysWorkService)
        {
            _daysWorkService = daysWorkService;
        }
        [HttpPost]
        public IActionResult AddDaysWork(DaysWork daysWork)
        {
            var result = _daysWorkService.Add(daysWork);
            return result.Success ? Ok(result) : BadRequest(result);
        }
        [HttpGet]
        public IActionResult GetDaysWork()
        {
            var result = _daysWorkService.GetAll();
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("getDaysWorkByUserId")]
        public IActionResult GetDaysWorkByUserId(int userId)
        {
            var result = _daysWorkService.GetByUserId(userId);
            return result.Success ? Ok(result) : BadRequest(result);
        }


        [HttpPut]
        public IActionResult UpdateDaysWork(DaysWork daysWork)
        {
            var result = _daysWorkService.Update(daysWork);
            return result.Success ? Ok(result) : BadRequest(result);

        }

        [HttpDelete]
        public IActionResult DeleteCustom(int id)
        {
            var result = _daysWorkService.Delete(id);
            return result.Success ? Ok(result) : BadRequest(result);

        }

        [HttpGet("exportToExcel")]
        public IActionResult GetExcel()
        {
            var result = _daysWorkService.ExportToExcel();
            return Ok(result);
        }

        [HttpGet("getDaysWorkByMonthAndYear")]
        public IActionResult getDaysWorkByMonthAndYear(int month , int year)
        {
            var result = _daysWorkService.GetByMonth(month , year);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("exportToExcelByMonthAndYear")]
        public IActionResult ExportToExcelByMonthAndYear(int month , int year)
        {
            var result = _daysWorkService.ExportToExcelByMonth(month , year);
            return Ok(result);
        }
    }
}
