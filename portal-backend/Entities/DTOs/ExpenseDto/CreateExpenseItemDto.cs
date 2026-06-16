namespace Entities.DTOs.ExpenseDto
{
    public class CreateExpenseItemDto
    {
        public string ItemName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public int KdvRate { get; set; }
    }
}

