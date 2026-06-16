namespace Entities.DTOs.NewsCommentDtos
{
    public class GetNewsCommentDto
    {
        public long Id { get; set; }
        public string Content { get; set; }
        public long NewsId { get; set; }
        public long UserId { get; set; }
        public string? UserName { get; set; }
        public long? ParentCommentId { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<GetNewsCommentDto> Replies { get; set; } = new();
    }
}
