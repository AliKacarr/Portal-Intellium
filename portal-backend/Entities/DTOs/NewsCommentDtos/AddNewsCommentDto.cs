namespace Entities.DTOs.NewsCommentDtos
{
    public class AddNewsCommentDto
    {
        public string Content { get; set; }
        public long NewsId { get; set; }
        public long? ParentCommentId { get; set; }
    }
}
