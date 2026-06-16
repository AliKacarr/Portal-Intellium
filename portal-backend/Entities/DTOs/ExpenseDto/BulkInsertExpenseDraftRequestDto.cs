namespace Entities.DTOs.ExpenseDto
{
    /// <summary>POST /api/expense/draft/bulk isteği. Taslaklar ayrı satırlar olarak kaydedilir.</summary>
    public class BulkInsertExpenseDraftRequestDto
    {
        public List<UpsertExpenseDraftDto> Expenses { get; set; } = new();
    }
}

