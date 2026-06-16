// Entities/DTOs/HealthInfoDtos/HealthInfoDocumentDto.cs
namespace Entities.DTOs.HealthInfoDtos
{
    public class HealthInfoDocumentDto
    {
        public long Id { get; set; }
        public string DocumentType { get; set; }
        public string FilePath { get; set; }
        public DateTime UploadedAt { get; set; }
    }
}