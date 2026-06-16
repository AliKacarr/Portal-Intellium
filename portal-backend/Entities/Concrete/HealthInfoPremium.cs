namespace Entities.Concrete
{
    public class HealthInfoPremium
    {
        public long Id { get; set; } // PK
        public long HealthInfoId { get; set; } // FK

        // Prim Bilgileri (Finansal - Adminlik)
        public decimal TotalPremium { get; set; } // Toplam Prim Tutarı
        public decimal EmployerContribution { get; set; } // İşveren Katkı Payı
        public decimal EmployeeContribution { get; set; } // Personel Katkı Payı
        public decimal? MonthlyDeduction { get; set; } // Aylık Kesinti Tutarı (Nullable)
        public string? TaxAdvantageInfo { get; set; } // Vergisel Avantaj Bilgisi (Nullable)
        public string? PaymentType { get; set; } // Prim Ödeme Türü (Peşin/Taksitli - Nullable)
        public string? InstallmentDetails { get; set; } // Taksit Detayları (örn: "6 taksit x 500₺" - Nullable)

        // İlişkisel Özellik
        public HealthInfo HealthInfo { get; set; } // Navigation property
    }
}