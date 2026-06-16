using System.Text.Json.Serialization;

namespace Entities.DTOs.ExpenseDto
{
    public class AddExpenseDto
    {
        /// <summary>
        /// (Opsiyonel) Var olan talep ile ilişkilendirmek için requestId.
        /// Revize sonrası yeniden gönderimde aynı requestId gönderilir.
        /// </summary>
        [JsonPropertyName("requestId")]
        public string? RequestId { get; set; }
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
        /// <summary>Frontend'den: günlük kabul × kişi sayısı. Backend doğrulayıp kullanır.</summary>
        public decimal AcceptedDailyAmount { get; set; }
        /// <summary>Frontend'den: karşılanmayacak tutar. Backend doğrulayıp kullanır.</summary>
        public decimal UncoveredAmount { get; set; }
        public string? MealPersonNames { get; set; }
        public string? MealDescription { get; set; }
        public string? ExpenseType { get; set; }
        /// <summary>ISO 4217 (TRY varsayılan). Boşsa TRY.</summary>
        public string? CurrencyCode { get; set; }
        public decimal ExcludingVatAmount { get; set; }
        public decimal VatRate { get; set; }
        // Frontend gönderse bile backend hesaplayabilir
        public decimal Vat { get; set; }
        public decimal TotalAmount { get; set; }
        public bool IsPinned { get; set; } = false;
        // "Taslak" | "Beklemede" | "Onaylandı" | "Onaylanmadı" | "Revize Bekliyor" | "Revize Edildi" (boşsa default Beklemede)
        public string? Status { get; set; }
        // base64-only veya data URL (data:*;base64,...) olabilir
        public string? ImageData { get; set; }
        /// <summary>Masraf dönemi "YYYY-MM". Önceki dönemlere ekleme yapılamaz.</summary>
        public string? ExpensePeriod { get; set; }
        /// <summary>Master-detail masraf kalemleri (opsiyonel). Gönderilirse ana tutar kalemlerden hesaplanır.</summary>
        public List<CreateExpenseItemDto> Items { get; set; } = new();
    }
}
