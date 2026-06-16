namespace Entities.DTOs.ExpenseDto
{
    /// <summary>Çoklu masraf ekleme isteği.</summary>
    public class BulkAddExpenseDto
    {
        public List<AddExpenseDto> Expenses { get; set; } = new();
    }
}
