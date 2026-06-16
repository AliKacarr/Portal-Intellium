using System.Text.Json.Serialization;

namespace Entities.DTOs.ExpenseDto
{
    /// <summary>
    /// Taslak ekleme/güncelleme için gevşek DTO.
    /// Zorunlu alanlar submit aşamasında doğrulanır.
    /// </summary>
    public class UpsertExpenseDraftDto
    {
        [JsonPropertyName("requestId")]
        public string? RequestId { get; set; }

        /// <summary>
        /// Taslaklar sadece oturum kullanıcısı adına tutulur; backend gerektiğinde override edebilir.
        /// </summary>
        public long? UserId { get; set; }

        public string? InvoiceNumber { get; set; }
        public string? InvoiceDate { get; set; } // "YYYY-MM-DD" (opsiyonel)
        public string? ProjectName { get; set; }
        public string? InvoiceTitle { get; set; }
        public string? ExtraCategorie { get; set; }
        public string? Description { get; set; }

        public int? PersonCount { get; set; }

        // Geriye dönük uyumluluk: eski frontend mealPersonCount gönderebilir.
        [JsonPropertyName("mealPersonCount")]
        public int? LegacyMealPersonCount { get => PersonCount; set => PersonCount = value; }

        public decimal? AcceptedDailyAmount { get; set; }
        public decimal? UncoveredAmount { get; set; }
        public string? MealPersonNames { get; set; }
        public string? MealDescription { get; set; }
        public string? ExpenseType { get; set; }
        public string? CurrencyCode { get; set; }

        public decimal? ExcludingVatAmount { get; set; }
        public decimal? VatRate { get; set; }
        public decimal? Vat { get; set; }
        public decimal? TotalAmount { get; set; }

        public bool? IsPinned { get; set; }

        /// <summary>İstemci "Taslak" gönderse bile backend taslak olarak kaydeder.</summary>
        public string? Status { get; set; }

        public string? ImageData { get; set; }
        /// <summary>Multipart yüklemede oluşturulan dosya yolu (örn. /uploads/expenses/xxx.jpg).</summary>
        public string? ImagePath { get; set; }
        public string? ExpensePeriod { get; set; } // "YYYY-MM"

        /// <summary>Masraf kalemleri (opsiyonel).</summary>
        public List<CreateExpenseItemDto>? Items { get; set; }
    }
}

