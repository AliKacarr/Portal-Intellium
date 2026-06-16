namespace Entities.DTOs.TicketDtos
{
    public class TicketCountDto
    {
        public int TotalCount { get; set; }
        public int NewRequestCount { get; set; }
        public int InProgressCount { get; set; }
        public int CompletedCount { get; set; }

    }
}
