namespace Entities.DTOs.ExpenseDto
{
    public class ExpenseDetailDto
    {
        public int Id { get; set; }
        /// <summary>Talep id (backend).</summary>
        public string? RequestId { get; set; }
        /// <summary>UI'da gösterilecek 8 haneli talep kodu.</summary>
        public string? RequestDisplayCode8 { get; set; }
        /// <summary>Yemek masrafı için kabul edilen toplam tutar (vergi dahil).</summary>
        public decimal AcceptedDailyAmount { get; set; }
        /// <summary>Yemek masrafında karşılanmayacak tutar (vergi dahil).</summary>
        public decimal UncoveredAmount { get; set; }
        /// <summary>Backend'in tek doğru kaynağı: bu masraf için geri ödenebilir tutar (KKEG hariç, yemek için uncovered düşülmüş).</summary>
        public decimal RefundAmount { get; set; }
        /// <summary>Bu masrafta KKEG olarak işaretlenen kalemlerin toplamı (vergi dahil).</summary>
        public decimal KkegTotalAmount { get; set; }
        public decimal OriginalTotalAmount { get; set; }
        public decimal? ApprovedTotalAmount { get; set; }
        public bool HasKkeg { get; set; }
        public string Status { get; set; } = "Beklemede";
        /// <summary>Revize talebi metni (varsa).</summary>
        public string? RevisionReason { get; set; }
        /// <summary>Red metni (varsa).</summary>
        public string? RejectReason { get; set; }
        /// <summary>ISO 4217. Tutarlar bu birimdedir.</summary>
        public string CurrencyCode { get; set; } = "TRY";
        public List<ExpenseItemDto> Items { get; set; } = new();
    }
}

