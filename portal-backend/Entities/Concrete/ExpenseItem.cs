namespace Entities.Concrete
{
    public class ExpenseItem
    {
        public int Id { get; set; }
        public int ExpenseId { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public int KdvRate { get; set; }
        public decimal TotalAmount { get; set; }
        public bool IsKkeg { get; set; } = false;

        public virtual Expense? Expense { get; set; }
    }
}

