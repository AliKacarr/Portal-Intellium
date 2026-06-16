namespace Entities.DTOs.ExpenseDto
{
    /// <summary>Masraf listesi filtreleme ve sıralama (getFiltered, export). Admin panelinde tüm şirket için getAllForAdmin kullanın.</summary>
    public class ExpenseFilterDto
    {
        /// <summary>Filtre: bu kullanıcıya ait masraflar (masraf sahibi UserId). Admin: boş ve IncludeAllUsers false ise sadece giriş yapan kullanıcı; belirli çalışan için userId gönderin.</summary>
        public long? UserId { get; set; }
        /// <summary>Admin: true ise userId boşken tüm kullanıcıların masrafları (dikkatli kullanın). false/null: dar kapsam (varsayılan: sadece kendi kayıtları veya aşağıdaki userId).</summary>
        public bool? IncludeAllUsers { get; set; }
        /// <summary>Dönem filtresi: "YYYY-MM"</summary>
        public string? Period { get; set; }
        /// <summary>Durum: Beklemede | Onaylandı | Onaylanmadı</summary>
        public string? Status { get; set; }
        /// <summary>Min toplam tutar</summary>
        public decimal? MinAmount { get; set; }
        /// <summary>Max toplam tutar</summary>
        public decimal? MaxAmount { get; set; }
        /// <summary>true ise sabitlenenler (IsPinned) önce listelenir. Query'de PinnedFirst veya sortByPinnedFirst.</summary>
        public bool SortByPinnedFirst { get; set; } = true;
        /// <summary>Query parametresi: PinnedFirst=true/false (SortByPinnedFirst ile aynı amaç).</summary>
        public bool? PinnedFirst { get; set; }
        /// <summary>Sayfalama: atlanacak kayıt sayısı (getAllForAdmin).</summary>
        public int? Skip { get; set; }
        /// <summary>Sayfalama: döndürülecek maksimum kayıt sayısı (getAllForAdmin).</summary>
        public int? Limit { get; set; }
        /// <summary>Arama: açıklama, fatura no, proje adı üzerinde metin araması (getAllForAdmin).</summary>
        public string? Search { get; set; }
    }
}
