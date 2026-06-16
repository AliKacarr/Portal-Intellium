namespace Entities.Concrete
{
    public class NewsComment
    {
        public long Id { get; set; }
        public string Content { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }

        public long? ParentCommentId { get; set; }
        public long NewsId { get; set; }
        public long UserId { get; set; }
    }
}
