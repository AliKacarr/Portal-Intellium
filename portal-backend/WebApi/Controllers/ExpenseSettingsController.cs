using Business.Repository.ExpenseSettingsRepository;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    /// <summary>

    /// </summary>
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ExpenseSettingsController : ControllerBase
    {
        private readonly IExpenseSettingsService _expenseSettingsService;

        public ExpenseSettingsController(IExpenseSettingsService expenseSettingsService)
        {
            _expenseSettingsService = expenseSettingsService;
        }

        /// <summary>Tüm giriş yapmış kullanıcılar erişebilir. Kayıt yoksa varsayılan değerlerle 200 döner.</summary>
        [HttpGet]
        public IActionResult Get()
        {
            var result = _expenseSettingsService.Get();
            return result.Success ? Ok(result.Data) : Ok(new { mealAcceptedDailyAmount = 500, previousPeriodCutoffDay = 5, vatRates = new[] { 1, 10, 20 } });
        }

        /// <summary>Sadece admin. Masraf ayarlarını günceller.</summary>
        [HttpPut]
        public IActionResult Put([FromBody] Entities.DTOs.ExpenseSettingsDto.UpdateExpenseSettingsDto dto)
        {
            var result = _expenseSettingsService.Update(dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
