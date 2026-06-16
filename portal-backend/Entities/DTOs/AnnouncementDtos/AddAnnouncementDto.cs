namespace Entities.DTOs.AnnouncementDtos
{
    public class AddAnnouncementDto
    {
        public string Title { get; set; }
        public string Content { get; set; }

        /// <summary>low | medium | high</summary>
        public string Priority { get; set; }
        public DateTime ExpiryDate { get; set; }
        public DateTime PublishDate { get; set; }
        public bool IsGeneral { get; set; } = false;
        public bool IsActive { get; set; } = true;
        public long? DepartmentId { get; set; }
        public string? ServiceArea { get; set; }
    }
}
