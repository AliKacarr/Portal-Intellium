namespace Entities.DTOs.ExpenseDto
{
    public class ExpenseItemDto
    {
        public int Id { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public int KdvRate { get; set; }
        public decimal TotalAmount { get; set; }
        public bool IsKkeg { get; set; }
    }
}

