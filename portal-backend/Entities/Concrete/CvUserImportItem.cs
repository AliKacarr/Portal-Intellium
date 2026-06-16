namespace Entities.Concrete
{
    public class CvUserImportItem
    {
        public long Id { get; set; }
        public long BatchId { get; set; }
        public int SortOrder { get; set; }
        public string FileName { get; set; }
        public string FilePath { get; set; }
        public string ContentType { get; set; }
        public long FileSize { get; set; }
        public string Status { get; set; }
        public string? ErrorMessage { get; set; }
        public string? ExtractedJson { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public long? CreatedUserId { get; set; }
    }
}
