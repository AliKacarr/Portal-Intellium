namespace Entities.Concrete
{
    public class News
    {
        public long Id { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public string? ImageUrl { get; set; }
        public DateTime PublishDate { get; set; }
        public bool IsPublished { get; set; } = false;
        public bool IsCommentable { get; set; } = true;
        public bool IsGeneral { get; set; } = false;
        public string? Tags { get; set; }
        public int ViewCount { get; set; } = 0;
        public bool IsActive { get; set; } = true;
        public bool IsDeleted { get; set; } = false;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public long CreatedById { get; set; }
        public long? DepartmentId { get; set; }
        public string? ServiceArea { get; set; }
        public long? NewsCategoryId { get; set; }
    }
}
