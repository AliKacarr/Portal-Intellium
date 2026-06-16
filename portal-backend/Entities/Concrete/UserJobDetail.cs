namespace Entities.Concrete
{
    public class UserJobDetail
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public string? AnotherId { get; set; }
        public string? RecruitmentSource { get; set; } //İşe Alma Kaynağı
        public string? WorkingStatus { get; set; } // Çalışma Durumu
        public string? Department { get; set; }  // Bölüm
        public string? Level { get; set; } // Seviye
        public string? PaymentType { get; set; } // Ücret Türü
        public string? ServiceArea { get; set; } // Hizmet Alanı
        public string? JobCode { get; set; } // Meslek Adı/Kodu
        public string? Seniority { get; set; } // Kıdem
        public string? Location { get; set; } // Konum
        public string? JobTitle { get; set; } // İş Ünvanı
        public string? ManagerName { get; set; } // Yönetici Adı
        public bool IsActive { get; set; } // Çalışma Durumu
        public string? DepartureReason { get; set; } // Ayrılma Nedeni
        public DateTime? DepartureDate { get; set; } // Ayrılma Tarihi
        public DateTime? StartDate { get; set; } // Başlama Tarihi
    }
}
