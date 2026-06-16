namespace Entities.DTOs.NewsDtos
{
    public class UpdateNewsDto
    {
        public long Id { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public string? ImageUrl { get; set; }
        public DateTime? PublishDate { get; set; }
        public bool IsPublished { get; set; }
        public bool IsCommentable { get; set; }
        public bool IsGeneral { get; set; }
        public bool IsActive { get; set; } = true;
        public string? Tags { get; set; }
        public long? DepartmentId { get; set; }
        public string? ServiceArea { get; set; }
        public long? NewsCategoryId { get; set; }
    }
}
