namespace Entities.DTOs.TicketDtos
{
    public class AssignUserToTicketDto
    {
        public long Id { get; set; }
        public long AssignedUserId { get; set; }
        public int? TargetBoardId { get; set; }
        public int? TargetTaskListId { get; set; }
    }
}
