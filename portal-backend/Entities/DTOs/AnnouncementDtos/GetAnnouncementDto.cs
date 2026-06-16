namespace Entities.DTOs.AnnouncementDtos
{
    public class GetAnnouncementDto
    {
        public long Id { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public string Priority { get; set; }
        public DateTime ExpiryDate { get; set; }
        public DateTime PublishDate { get; set; }
        public int ViewCount { get; set; }
        public bool IsGeneral { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public long? DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
        public string? ServiceArea { get; set; }
        public long CreatedByUserId { get; set; }
        public string? CreatedByName { get; set; }
    }
}
