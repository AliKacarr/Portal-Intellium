using Entities.DTOs.UserDtos;
using System;
using System.Collections.Generic;

namespace Entities.DTOs.HealthInfoDtos
{
    public class GetHealthInfoWithUserDto
    {
        public long Id { get; set; }
        public BaseUserDto User { get; set; }
        public string InsuranceCompanyName { get; set; }
        public string InsurancePolicyNo { get; set; }
        public DateTime InsuranceBeginDate { get; set; }
        public DateTime InsuranceEndDate { get; set; }
        public DateTime AddedAt { get; set; }
        public bool IsActive { get; set; }
        
        public string? PolicyType { get; set; }
        public string? PolicyStatus { get; set; }
        public string? PlanName { get; set; }
        public string? CoverageArea { get; set; }
        public string? CoverageLimit { get; set; }
        public string? CoveragePercentage { get; set; }

        // --- YENİ EKLENEN ACENTE ALANLARI ---
        public string AgencyName { get; set; }
        public string AgencyContactPerson { get; set; }
        public string AgencyContactPhone { get; set; }

        // İlişkili Veriler
        public HealthInfoPremiumDto? PremiumDetails { get; set; }
        public List<HealthInfoDependentDto> Dependents { get; set; } = new List<HealthInfoDependentDto>();
        public List<HealthInfoDocumentDto> Documents { get; set; } = new List<HealthInfoDocumentDto>();
    }
}