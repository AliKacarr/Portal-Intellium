using System.Text.Json.Serialization;

namespace Entities.DTOs.ExpenseDto
{
    /// <summary>Groq vision çıktısı — fiş alanları ve kalem listesi.</summary>
    public record ReceiptExtractionResultDto
    {
        [JsonPropertyName("totalAmount")]
        public decimal? TotalAmount { get; init; }

        [JsonPropertyName("taxAmount")]
        public decimal? TaxAmount { get; init; }

        [JsonPropertyName("taxRate")]
        public decimal? TaxRate { get; init; }

        /// <summary>YYYY-MM-DD</summary>
        [JsonPropertyName("date")]
        public string? Date { get; init; }

        [JsonPropertyName("invoice_number")]
        public string? InvoiceNumber { get; init; }

        [JsonPropertyName("vendor_name")]
        public string? VendorName { get; init; }

        [JsonPropertyName("currency_code")]
        public string? CurrencyCode { get; init; }

        [JsonPropertyName("description")]
        public string? Description { get; init; }

        [JsonPropertyName("excluding_vat_amount")]
        public decimal? ExcludingVatAmount { get; init; }

        [JsonPropertyName("vat_rate_percent")]
        public decimal? VatRatePercent { get; init; }

        /// <summary>Fişteki ürün/hizmet satırları (Türkçe fişlerde kalem adları).</summary>
        [JsonPropertyName("line_items")]
        public List<ReceiptExtractionLineItemDto>? LineItems { get; init; }
    }

    public sealed class ReceiptExtractionLineItemDto
    {
        [JsonPropertyName("item_name")]
        public string? ItemName { get; init; }

        [JsonPropertyName("quantity")]
        public decimal? Quantity { get; init; }

        [JsonPropertyName("unit_price")]
        public decimal? UnitPrice { get; init; }

        [JsonPropertyName("kdv_rate")]
        public decimal? KdvRate { get; init; }
    }
}
