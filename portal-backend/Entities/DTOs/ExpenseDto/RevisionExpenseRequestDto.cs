namespace Entities.DTOs.ExpenseDto
{
    /// <summary>PUT /api/expense/request/{requestId}/revision gövdesi (red endpoint ile aynı şekil, ayrı neden alanı).</summary>
    public class RevisionExpenseRequestDto
    {
        public string Reason { get; set; } = "";
        public string? ExpenseTypeFallback { get; set; }
    }
}
