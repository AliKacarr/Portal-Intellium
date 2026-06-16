namespace Entities.DTOs.ExpenseDto
{
    public class ApproveExpenseRequestDto
    {
        public List<ApproveExpenseRequestItemDto> Items { get; set; } = new();
    }

    public class ApproveExpenseRequestItemDto
    {
        public int ExpenseId { get; set; }
        public List<int> KkegItemIds { get; set; } = new();
        public decimal? ApprovedTotalAmountOverride { get; set; }
    }
}

