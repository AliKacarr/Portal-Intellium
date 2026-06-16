namespace Entities.DTOs.TicketEffortDtos
{
    public class GetTicketEffortDto
    {
        public long Id { get; set; }
        public long CreatedByUserId { get; set; }
        public int EffortMinutes { get; set; }
        public string Description { get; set; }
        public bool IsBillable { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
