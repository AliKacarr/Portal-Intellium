namespace Entities.Concrete
{
    public class HealthInfoDependent
    {
        public long Id { get; set; } // PK
        public long HealthInfoId { get; set; } // FK

        public string DependentName { get; set; } // Ek Kişinin Adı Soyadı
        public string Relationship { get; set; } // Yakınlık Derecesi (Eş, Çocuk, Baba)
        public string? CoverageStatus { get; set; } // Kapsam Durumu (Aktif/Dahil Değil - Nullable)
        public string? PlanDetails { get; set; } // Farklı Plan Bilgisi (Varsa - Nullable)

        // İlişkisel Özellik
        public HealthInfo HealthInfo { get; set; } // Navigation property
    }
}