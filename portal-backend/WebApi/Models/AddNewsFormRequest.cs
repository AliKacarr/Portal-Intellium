using Microsoft.AspNetCore.Http;

namespace WebApi.Models
{
    /// <summary>Yeni haber — multipart: metin alanları + opsiyonel görsel dosyası (ImageFile).</summary>
    public class AddNewsFormRequest
    {
        public string Title { get; set; } = "";
        public string Content { get; set; } = "";
        public string? ImageUrl { get; set; }
        public DateTime? PublishDate { get; set; }
        public bool IsPublished { get; set; }
        public bool IsCommentable { get; set; } = true;
        public bool IsGeneral { get; set; } = true;
        public string? Tags { get; set; }
        public long? DepartmentId { get; set; }
        public string? ServiceArea { get; set; }
        public long? NewsCategoryId { get; set; }
        public IFormFile? ImageFile { get; set; }
    }
}
