using Entities.Enums;

namespace Entities.DTOs.TicketDtos
{
    public class EditTicketDto
    {
        public long Id { get; set; }
        public TicketStatus Status { get; set; }
        public long? AssignedUserId { get; set; }
        public int? TargetBoardId { get; set; }
        public int? TargetTaskListId { get; set; }
        public string? RequestType { get; set; }
    }
}
