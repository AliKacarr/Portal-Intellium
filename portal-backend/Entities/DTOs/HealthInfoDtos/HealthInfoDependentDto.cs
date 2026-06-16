// Entities/DTOs/HealthInfoDtos/HealthInfoDependentDto.cs
namespace Entities.DTOs.HealthInfoDtos
{
    public class HealthInfoDependentDto
    {
        public long Id { get; set; } // Güncelleme/Silme işlemleri için 0 (yeni) veya > 0 (mevcut) olabilir
        public string DependentName { get; set; }
        public string Relationship { get; set; }
        public string? CoverageStatus { get; set; }
        public string? PlanDetails { get; set; }
    }
}