namespace Entities.DTOs.ExpenseSettingsDto
{
    public class UpdateExpenseSettingsDto
    {
        public int MealAcceptedDailyAmount { get; set; }
        public int PreviousPeriodCutoffDay { get; set; }
        public List<int> VatRates { get; set; } = new();
    }
}
