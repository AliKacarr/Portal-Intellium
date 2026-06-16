namespace Entities.DTOs.ExpenseDto
{
    /// <summary>Masraf para birimi seçenekleri (dropdown).</summary>
    public class ExpenseCurrencyOptionDto
    {
        public string Code { get; set; } = "TRY";
        public string NameTr { get; set; } = "";
        public string Symbol { get; set; } = "";
    }
}
