
using Entities.Enums;

namespace Entities.Concrete
{
    public class Ticket
    {
        public long Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public TicketStatus Status { get; set; }
        //public int Priority { get; set; }
        public long ProjectId { get; set; }
        public long CustomerId { get; set; }
        public DateTime CreationDate { get; set; }
        public DateTime? AssignedDate { get; set; }
        public DateTime? ResolutionDate { get; set; }
        public long CreatorUserId { get; set; }
        public long? AssignedUserId { get; set; }
        public string? RequestType { get; set; }
    }
}
