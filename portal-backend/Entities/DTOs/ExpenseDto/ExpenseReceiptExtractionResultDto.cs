namespace Entities.DTOs.ExpenseDto
{
    /// <summary>Fiş/fatura görüntüsünden çıkarılan, masraf formu ile uyumlu önerilen alanlar (elle düzeltmeye açık).</summary>
    public class ExpenseReceiptExtractionResultDto
    {
        public string? InvoiceNumber { get; set; }
        /// <summary>YYYY-MM-DD</summary>
        public string? InvoiceDate { get; set; }
        /// <summary>İşletme / satıcı adı (InvoiceTitle ile eşlenebilir).</summary>
        public string? InvoiceTitle { get; set; }
        public string? CurrencyCode { get; set; }
        public string? Description { get; set; }
        public List<ExpenseReceiptExtractedItemDto> Items { get; set; } = new();
        public decimal? TotalAmount { get; set; }
        public decimal? Vat { get; set; }
        public decimal? ExcludingVatAmount { get; set; }
        public decimal? VatRate { get; set; }
    }

    public class ExpenseReceiptExtractedItemDto
    {
        public string ItemName { get; set; } = string.Empty;
        public int Quantity { get; set; } = 1;
        public decimal UnitPrice { get; set; }
        public int KdvRate { get; set; }
    }
}
