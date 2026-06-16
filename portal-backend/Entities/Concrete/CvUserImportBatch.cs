namespace Entities.Concrete
{
    public class CvUserImportBatch
    {
        public long Id { get; set; }
        public long CreatedByUserId { get; set; }
        public DateTime CreatedAt { get; set; }
        public string Status { get; set; }
        public int TotalCount { get; set; }
        public int ProcessedCount { get; set; }
        public int FailedCount { get; set; }
    }
}
