namespace Entities.DTOs.ExpenseDto
{
    public class ApproveExpenseDto
    {
        public int ExpenseId { get; set; }
        public List<int> KkegItemIds { get; set; } = new();
        public decimal? ApprovedTotalAmountOverride { get; set; }
    }
}

