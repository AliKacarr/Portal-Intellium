namespace Entities.Concrete
{
    /// <summary>
    /// Kullanıcı masraf formunu tamamlamadan çıkarsa saklanan ham form snapshot'ı.
    /// Ana Expense tablolarından bağımsız tutulur.
    /// </summary>
    public class ExpenseIncompleteDraft
    {
        public Guid Id { get; set; }
        public long UserId { get; set; }
        public string Status { get; set; } = "Tamamlanmamış";
        /// <summary>Frontend'in ham form snapshot'ı (JSONB).</summary>
        public string PayloadJson { get; set; } = "{}";
        /// <summary>Hard delete için dönemin bitiş zamanı (UTC).</summary>
        public DateTime? PeriodEndAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}

