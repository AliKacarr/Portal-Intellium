namespace Entities.DTOs.ExpenseDto
{
    /// <summary>POST /api/expense/bulk isteği. Her öğe ayrı satır olarak kaydedilir; createdBy = isteği atan kullanıcı, status = Beklemede.</summary>
    public class BulkInsertExpenseRequestDto
    {
        public List<BulkExpenseItemDto> Expenses { get; set; } = new();
    }
}
