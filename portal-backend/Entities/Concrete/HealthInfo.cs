using Entities.Concrete; // Namespace'in doğru olduğundan emin ol

namespace Entities.Concrete
{
    public class HealthInfo
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public string InsuranceCompanyName { get; set; } // Zorunlu
        public string InsurancePolicyNo { get; set; } // Zorunlu
        public DateTime InsuranceBeginDate { get; set; } // Zorunlu
        public DateTime InsuranceEndDate { get; set; } // Zorunlu
        public DateTime AddedAt { get; set; }
        public bool IsActive { get; set; }

        // --- PDF'ten Gelen Alanlar ---
        public string? PolicyType { get; set; }
        public string? PolicyStatus { get; set; }
        public string? PlanName { get; set; }
        public string? CoverageArea { get; set; }
        public string? CoverageLimit { get; set; }
        public string? CoveragePercentage { get; set; }

        // --- YENİ EKLENEN ACENTE ALANLARI ---
        public string AgencyName { get; set; }            // Acente İsmi
        public string AgencyContactPerson { get; set; }   // İletişim Kurulacak Kişi
        public string AgencyContactPhone { get; set; }    // İletişim Telefonu

        // --- Navigation Properties ---
        public User User { get; set; }
        public HealthInfoPremium? HealthInfoPremium { get; set; }
        public ICollection<HealthInfoDependent> HealthInfoDependents { get; set; }
        public ICollection<HealthInfoDocument> HealthInfoDocuments { get; set; }

        public HealthInfo()
        {
            HealthInfoDependents = new HashSet<HealthInfoDependent>();
            HealthInfoDocuments = new HashSet<HealthInfoDocument>();
        }
    }
}