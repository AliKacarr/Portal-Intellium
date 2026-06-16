namespace Entities.Concrete
{
    public class Poll
    {
        public long Id { get; set; }
        public string Title { get; set; }
        public string? Content { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int ViewCount { get; set; } = 0;
        public int TotalParticipants { get; set; } = 0;
        public bool IsGeneral { get; set; } = false;
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }

        public long? DepartmentId { get; set; }
        public long CreatedById { get; set; }
    }
}
