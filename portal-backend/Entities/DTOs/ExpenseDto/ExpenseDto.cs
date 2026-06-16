using System.Text.Json.Serialization;

namespace Entities.DTOs.ExpenseDto
{
    public class ExpenseDto
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }
        /// <summary>Aynı form submit’inde oluşan masrafları gruplar.</summary>
        [JsonPropertyName("requestId")]
        public string? RequestId { get; set; }

        /// <summary>UI'da gösterilecek 8 haneli talep kodu (requestId'den türetilir).</summary>
        [JsonPropertyName("requestDisplayCode8")]
        public string? RequestDisplayCode8 { get; set; }

        /// <summary>
        /// Backend'in tek doğru kaynağı: bu masraf için geri ödenebilir tutar (KKEG hariç, yemek için uncovered düşülmüş).
        /// UI toplam geri ödeme hesaplarını bu alan üzerinden yapmalıdır.
        /// </summary>
        [JsonPropertyName("refundAmount")]
        public decimal RefundAmount { get; set; }

        /// <summary>Bu masrafta KKEG olarak işaretlenen kalemlerin toplamı (vergi dahil).</summary>
        [JsonPropertyName("kkegTotalAmount")]
        public decimal KkegTotalAmount { get; set; }
        public long UserId { get; set; }
        public string InvoiceNumber { get; set; }
        // Frontend `new Date(invoiceDate)` yapıyor, request/response "YYYY-MM-DD" kullanır.
        public string InvoiceDate { get; set; }
        public string ProjectName { get; set; }
        // Kategori
        public string InvoiceTitle { get; set; }
        /// <summary>"Diğer" kategorisi için alt kategori/metin (opsiyonel).</summary>
        public string? ExtraCategorie { get; set; }
        /// <summary>K.K.E.G. (Kanunen Kabul Edilmeyen Gider) işareti (opsiyonel).</summary>
        public bool? IsKkeg { get; set; }
        /// <summary>Onaycı tarafından belirlenen onaylanan toplam tutar (opsiyonel).</summary>
        public decimal? ApprovedTotalAmount { get; set; }
        public decimal OriginalTotalAmount { get; set; }
        public bool HasKkeg { get; set; }
        public List<ExpenseItemDto> Items { get; set; } = new();
        // "Kredi Kartı" | "Nakit" | "Havale"
        public string? ExpenseType { get; set; }
        // max 200
        public string Description { get; set; }
        /// <summary>Yemek / ulaşım vb. için katılımcı sayısı.</summary>
        public int PersonCount { get; set; }
        // Geriye dönük uyumluluk: eski frontend response'ta mealPersonCount bekleyebilir.
        [JsonPropertyName("mealPersonCount")]
        public int LegacyMealPersonCount
        {
            get => PersonCount;
            set => PersonCount = value;
        }
        public decimal AcceptedDailyAmount { get; set; }
        public decimal UncoveredAmount { get; set; }
        public string? MealPersonNames { get; set; }
        public string? MealDescription { get; set; }
        public decimal ExcludingVatAmount { get; set; }
        public decimal VatRate { get; set; }
        public decimal Vat { get; set; }
        public decimal TotalAmount { get; set; }
        public bool IsPinned { get; set; }
        public long CreatedUserId { get; set; }
        /// <summary>Masrafı ekleyen kullanıcının adı (createdUserName / creatorName).</summary>
        public string? CreatedUserName { get; set; }
        public long? ApprovedUserId { get; set; }
        // "Beklemede" | "Onaylandı" | "Onaylanmadı" | "Revize Bekliyor"
        public string Status { get; set; }
        // base64-only (data URL prefix olmadan), null olabilir
        public string? ImageData { get; set; }
        /// <summary>Yüklenen fatura dosyası yolu/URL (bulk upload).</summary>
        public string? ImagePath { get; set; }
        /// <summary>Masraf dönemi "YYYY-MM"</summary>
        public string? ExpensePeriod { get; set; }
        /// <summary>Red açıklaması (Onaylanmadı durumunda kullanıcıya gösterilir).</summary>
        [JsonPropertyName("rejectReason")]
        public string? RejectReason { get; set; }
        /// <summary>Revize talebi açıklaması (Revize Bekliyor durumunda).</summary>
        [JsonPropertyName("revisionReason")]
        public string? RevisionReason { get; set; }
        /// <summary>ISO 4217 para birimi. Tutarlar bu birimdedir.</summary>
        public string CurrencyCode { get; set; } = "TRY";
    }
}
