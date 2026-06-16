namespace Entities.Concrete
{
    public class TicketComment
    {
        public long Id { get; set; }
        public long TicketId { get; set; }
        public string Content { get; set; }
        public long UserId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

    }
}
