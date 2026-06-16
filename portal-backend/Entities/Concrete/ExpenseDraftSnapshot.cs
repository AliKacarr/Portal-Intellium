namespace Entities.Concrete
{
    /// <summary>
    /// Frontend taslak snapshot'ı (uuid id) — expense tablosundan bağımsız.
    /// </summary>
    public class ExpenseDraftSnapshot
    {
        public Guid Id { get; set; }
        public long UserId { get; set; }
        public string Status { get; set; } = "Taslak";
        public string PayloadJson { get; set; } = "{}";
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}

