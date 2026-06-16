namespace Entities.DTOs.TicketEffortDtos
{
    public class AddTicketEffortDto
    {
        public long TicketId { get; set; }
        public int EffortMinutes { get; set; }
        public string Description { get; set; }
        public bool IsBillable { get; set; }
    }
}
