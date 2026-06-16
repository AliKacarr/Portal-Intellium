// Entities/DTOs/HealthInfoDtos/HealthInfoPremiumDto.cs
namespace Entities.DTOs.HealthInfoDtos
{
    public class HealthInfoPremiumDto
    {
        public decimal? TotalPremium { get; set; }
        public decimal? EmployerContribution { get; set; }
        public decimal? EmployeeContribution { get; set; }
        public decimal? MonthlyDeduction { get; set; }
        public string? TaxAdvantageInfo { get; set; }
        public string? PaymentType { get; set; }
        public string? InstallmentDetails { get; set; }
    }
}