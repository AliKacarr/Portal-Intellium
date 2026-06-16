namespace Entities.Concrete
{
    public class HealthInfoDocument
    {
        public long Id { get; set; } // PK
        public long HealthInfoId { get; set; } // FK

        public string DocumentType { get; set; } // Belge Türü (Poliçe PDF, Tahsilat Makbuzu vb.)
        public string FilePath { get; set; } // Belgenin dosya yolu/adı
        public DateTime UploadedAt { get; set; } // Yüklenme Zamanı

        // İlişkisel Özellik
        public HealthInfo HealthInfo { get; set; } // Navigation property
    }
}