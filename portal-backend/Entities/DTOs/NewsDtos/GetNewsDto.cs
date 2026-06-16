namespace Entities.DTOs.NewsDtos
{
    public class GetNewsDto
    {
        public long Id { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public string? ImageUrl { get; set; }
        public DateTime PublishDate { get; set; }
        public bool IsPublished { get; set; }
        public bool IsCommentable { get; set; }
        public bool IsGeneral { get; set; }
        public string? Tags { get; set; }
        public int ViewCount { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public long CreatedById { get; set; }
        public string? CreatedByName { get; set; }
        public long? DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
        public string? ServiceArea { get; set; }
        public long? NewsCategoryId { get; set; }
        public string? NewsCategoryName { get; set; }
    }

    public class NewsListDto
    {
        public long Id { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public string? ImageUrl { get; set; }
        public DateTime PublishDate { get; set; }
        public bool IsPublished { get; set; }
        public bool IsCommentable { get; set; }
        public bool IsGeneral { get; set; }
        public bool IsActive { get; set; }
        public string? Tags { get; set; }
        public int ViewCount { get; set; }
        public long? DepartmentId { get; set; }
        public string? CreatedByName { get; set; }
        public long CreatedById { get; set; }
        public string? DepartmentName { get; set; }
        public string? ServiceArea { get; set; }
        public string? NewsCategoryName { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
