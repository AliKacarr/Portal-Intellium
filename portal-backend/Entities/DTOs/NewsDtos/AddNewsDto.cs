namespace Entities.DTOs.NewsDtos
{
    public class AddNewsDto
    {
        public string Title { get; set; }
        public string Content { get; set; }
        public string? ImageUrl { get; set; }
        public DateTime? PublishDate { get; set; }
        public bool IsPublished { get; set; } = false;
        public bool IsCommentable { get; set; } = true;
        public bool IsGeneral { get; set; } = false;
        public bool IsActive { get; set; } = true;
        public string? Tags { get; set; }
        public long? DepartmentId { get; set; }
        public string? ServiceArea { get; set; }
        public long? NewsCategoryId { get; set; }
    }
}
