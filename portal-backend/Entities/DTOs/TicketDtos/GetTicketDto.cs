using Entities.DTOs.CustomerDtos;
using Entities.DTOs.ProjectDtos;
using Entities.Enums;

namespace Entities.DTOs.TicketDtos
{
    public class GetTicketDto
    {
        public long Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public TicketStatus Status { get; set; }
        public ProjectForTicketDto Project { get; set; }
        public BasicCustomerDto Customer { get; set; }
        public DateTime CreationDate { get; set; }
        public DateTime? AssignedDate { get; set; }
        public DateTime? ResolutionDate { get; set; }
        public TicketUserDto CreatorUser { get; set; }
        public TicketUserDto? AssignedUser { get; set; }
        public string? RequestType { get; set; }
    }
}
