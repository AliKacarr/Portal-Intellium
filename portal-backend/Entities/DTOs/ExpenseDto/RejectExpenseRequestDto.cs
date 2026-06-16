namespace Entities.DTOs.ExpenseDto
{
    public class RejectExpenseRequestDto
    {
        public string Reason { get; set; } = "";
        public string? ExpenseTypeFallback { get; set; }
    }
}

