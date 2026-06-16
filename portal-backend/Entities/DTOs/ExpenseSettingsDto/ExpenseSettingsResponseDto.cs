namespace Entities.DTOs.ExpenseSettingsDto
{
    public class ExpenseSettingsResponseDto
    {
        public int MealAcceptedDailyAmount { get; set; }
        public int PreviousPeriodCutoffDay { get; set; }
        public List<int> VatRates { get; set; } = new();
    }
}
