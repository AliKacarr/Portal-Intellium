namespace Entities.Concrete
{
    public class TicketCommentReply
    {
        public long Id { get; set; }
        public long TicketCommentId { get; set; }
        public string Content { get; set; }
        public long UserId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
