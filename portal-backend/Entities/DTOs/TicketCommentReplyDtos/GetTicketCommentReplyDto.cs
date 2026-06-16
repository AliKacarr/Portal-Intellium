using Entities.DTOs.TicketCommentDtos;

namespace Entities.DTOs.TicketCommentReplyDtos
{
    public class GetTicketCommentReplyDto
    {
        public long Id { get; set; }
        public string Content { get; set; }
        public TicketCommentUserDto User { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
