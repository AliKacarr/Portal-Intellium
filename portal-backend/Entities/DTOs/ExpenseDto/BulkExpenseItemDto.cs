using System.Text.Json.Serialization;

namespace Entities.DTOs.ExpenseDto
{
    /// <summary>Çoklu ekleme (bulk) için tek masraf öğesi. ImageFileIndex: multipart'taki dosya sırası (0 tabanlı).</summary>
    public class BulkExpenseItemDto
    {
        public long UserId { get; set; }
        public string InvoiceNumber { get; set; } = "";
        public string InvoiceDate { get; set; } = ""; // "YYYY-MM-DD"
        public string ProjectName { get; set; } = "";
        public string InvoiceTitle { get; set; } = "";
        /// <summary>"Diğer" kategorisi için alt kategori/metin (opsiyonel).</summary>
        public string? ExtraCategorie { get; set; }
        public string Description { get; set; } = "";
        public int PersonCount { get; set; }
        // Geriye dönük uyumluluk: eski frontend mealPersonCount gönderebilir.
        [JsonPropertyName("mealPersonCount")]
        public int LegacyMealPersonCount { get => PersonCount; set => PersonCount = value; }
        public decimal AcceptedDailyAmount { get; set; }
        public decimal UncoveredAmount { get; set; }
        public string? MealPersonNames { get; set; }
        public string? MealDescription { get; set; }
        public string? ExpenseType { get; set; }
        /// <summary>ISO 4217. Boşsa TRY.</summary>
        public string? CurrencyCode { get; set; }
        public decimal ExcludingVatAmount { get; set; }
        public decimal VatRate { get; set; }
        public bool IsPinned { get; set; }
        /// <summary>Base64 fatura görseli (opsiyonel; dosya yükleme varsa ImageFileIndex kullanılabilir).</summary>
        public string? ImageData { get; set; }
        /// <summary>Dönem "YYYY-MM". Boşsa fatura tarihinden türetilir.</summary>
        public string? ExpensePeriod { get; set; }
        /// <summary>Multipart istekteki dosya sıra numarası (0 tabanlı). Bu indeksteki dosya bu masrafa atanır.</summary>
        public int? ImageFileIndex { get; set; }
    }
}
