using System.Text.Json.Serialization;

namespace Entities.DTOs.ExpenseDto
{
    public class UpdateExpenseDto
    {
        public int Id { get; set; }
        public long UserId { get; set; }
        public string InvoiceNumber { get; set; }
        // "YYYY-MM-DD"
        public string InvoiceDate { get; set; }
        public string ProjectName { get; set; }
        public string InvoiceTitle { get; set; }
        /// <summary>"Diğer" kategorisi için alt kategori/metin (opsiyonel).</summary>
        public string? ExtraCategorie { get; set; }
        public string Description { get; set; }
        public int PersonCount { get; set; }
        // Geriye dönük uyumluluk: eski frontend mealPersonCount gönderebilir.
        [JsonPropertyName("mealPersonCount")]
        public int LegacyMealPersonCount { get => PersonCount; set => PersonCount = value; }
        public decimal AcceptedDailyAmount { get; set; }
        public decimal UncoveredAmount { get; set; }
        public string? MealPersonNames { get; set; }
        public string? MealDescription { get; set; }
        public string? ExpenseType { get; set; }
        /// <summary>ISO 4217 (TRY varsayılan).</summary>
        public string? CurrencyCode { get; set; }
        public decimal ExcludingVatAmount { get; set; }
        public decimal VatRate { get; set; }
        public decimal Vat { get; set; }
        public decimal TotalAmount { get; set; }
        public bool IsPinned { get; set; }
        public long? ApprovedUserId { get; set; }
        public string? Status { get; set; }
        public string? ImageData { get; set; }
        public string? ExpensePeriod { get; set; }
        /// <summary>Red açıklaması (frontend rejectReason, rejectionReason veya statusReason gönderebilir).</summary>
        public string? RejectReason { get; set; }
        public string? RejectionReason { get; set; }
        public string? StatusReason { get; set; }
    }
}
