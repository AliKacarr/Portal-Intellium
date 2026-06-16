namespace Entities.Concrete
{
    public class Announcement
    {
        public long Id { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }

        /// <summary>low | medium | high</summary>
        public string Priority { get; set; }
        public DateTime ExpiryDate { get; set; }
        public DateTime PublishDate { get; set; }
        public int ViewCount { get; set; } = 0;

        /// <summary>true = tüm kullanıcılar, false = belirli departman</summary>
        public bool IsGeneral { get; set; } = false;
        public bool IsActive { get; set; } = true;
        public bool IsDeleted { get; set; } = false;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public long? DepartmentId { get; set; }
        public string? ServiceArea { get; set; }
        public long CreatedByUserId { get; set; }
    }
}
