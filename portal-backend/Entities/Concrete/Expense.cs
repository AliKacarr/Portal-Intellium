namespace Entities.Concrete
{
    public class Expense
    {
        public int Id { get; set; }
        /// <summary>Aynı form submit’inde oluşan masrafları gruplar.</summary>
        public string RequestId { get; set; } = string.Empty;
        public long CustomerId { get; set; }
        public long UserId { get; set; }
        public long CreatedUserId { get; set; }
        public long? ApprovedUserId { get; set; }
        public string ProjectName { get; set; }
        public string Description { get; set; }
        /// <summary>Yemek veya ulaşım gibi kategorilerde katılımcı/kişi sayısı (tek kolon).</summary>
        public int PersonCount { get; set; }
        /// <summary>Yemek için: günlük kabul edilen tutar × kişi sayısı (toplam kabul edilen).</summary>
        public decimal AcceptedDailyAmount { get; set; }
        /// <summary>Yemek için: karşılanmayacak tutar (exceeding amount).</summary>
        public decimal UncoveredAmount { get; set; }
        public string? MealPersonNames { get; set; }
        public string? MealDescription { get; set; }
        public string? ExpenseType { get; set; }
        /// <summary>ISO 4217 para birimi (TRY, USD, EUR, GBP, …). Tutarlar bu birimde; TL çevrimi yapılmaz.</summary>
        public string CurrencyCode { get; set; } = "TRY";
        public decimal ExcludingVatAmount { get; set; }
        public decimal VatRate { get; set; }
        public decimal Vat { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal OriginalTotalAmount { get; set; }
        public bool HasKkeg { get; set; } = false;
        public DateTime InvoiceDate { get; set; }
        public string InvoiceNumber { get; set; }
        public string InvoiceTitle { get; set; }
        /// <summary>
        /// "Diğer" kategorisi için alt kategori/metin. invoiceTitle == "Diğer" iken frontend "Diğer (ExtraCategorie)" gösterir.
        /// </summary>
        public string? ExtraCategorie { get; set; }
        /// <summary>
        /// K.K.E.G. (Kanunen Kabul Edilmeyen Gider) işareti. Sadece bilgi amaçlıdır; başka kurallarla bağlantısı yoktur.
        /// Nullable tutulur: default boş (null).
        /// </summary>
        public bool? IsKkeg { get; set; }
        /// <summary>
        /// Onaycı tarafından belirlenen onaylanan toplam tutar (opsiyonel). Default null; onaylandığında istenirse override edilebilir.
        /// </summary>
        public decimal? ApprovedTotalAmount { get; set; }
        // Frontend Türkçe bekliyor: "Beklemede" | "Onaylandı" | "Onaylanmadı" | "Revize Bekliyor"
        public string Status { get; set; } = "Beklemede";
        public bool IsActive { get; set; }
        public bool IsPinned { get; set; } = false;
        // DB'de bytea olarak tutulur, API'de base64-only string olarak taşınır
        public byte[]? ImageData { get; set; }
        /// <summary>Yüklenen fatura dosyasının yolu (örn. /uploads/expenses/xxx.jpg). Bulk upload ile set edilir.</summary>
        public string? ImagePath { get; set; }
        public bool IsConfirmation { get; set; } = false; //Admin onayı için
        /// <summary>Masrafın ait olduğu dönem: "YYYY-MM". NULL olabilir (eski kayıtlar).</summary>
        public string? ExpensePeriod { get; set; }
        /// <summary>Red açıklaması (Onaylanmadı durumunda kullanıcıya gösterilir).</summary>
        public string? RejectReason { get; set; }
        /// <summary>Revize talebi açıklaması (Status = Revize Bekliyor iken).</summary>
        public string? RevisionReason { get; set; }

        /// <summary>Masraf kalemleri (master-detail).</summary>
        public virtual ICollection<ExpenseItem> ExpenseItems { get; set; } = new List<ExpenseItem>();
    }
}
