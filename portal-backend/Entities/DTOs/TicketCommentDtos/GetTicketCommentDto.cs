using Entities.DTOs.TicketCommentReplyDtos;

namespace Entities.DTOs.TicketCommentDtos
{
    public class GetTicketCommentDto
    {
        public long Id { get; set; }
        public string Content { get; set; }
        public TicketCommentUserDto User { get; set; }
        public List<GetTicketCommentReplyDto> ticketCommentReplies { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
