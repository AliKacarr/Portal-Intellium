using Business.Repository.HolidayRepository;
using Entities.Concrete;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    [Route("api/holiday")]
    [ApiController]
    public class HolidayController : ControllerBase
    {
        private readonly IHolidayService _holidayService;

        public HolidayController(IHolidayService holidayService)
        {
            _holidayService = holidayService;
        }

        [HttpPost("add")]
        public IActionResult Add(Holiday holiday)
        {
            var result = _holidayService.Add(holiday);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("getAll")]
        public IActionResult GetAll()
        {
            var result = _holidayService.GetAll();
            return result.Success ? Ok(result) : NotFound(result);
        }

        [HttpPut("update")]
        public IActionResult Update(Holiday holiday)
        {
            var result = _holidayService.Update(holiday);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpDelete("delete")]
        public IActionResult Delete(int id)
        {
            var result = _holidayService.Delete(id);
            return result.Success ? Ok(result) : NotFound(result);
        }

        // --- YENİ ENDPOINT ---
        // POST: api/holiday/generateHolidays?year=2025
        [HttpPost("generateHolidays")]
        public IActionResult GenerateHolidays(int year)
        {
            var result = _holidayService.GenerateHolidaysForYear(year);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}