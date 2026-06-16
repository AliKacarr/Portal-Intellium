using Entities.Concrete;
using Entities.DTOs.CustomerDtos;
using Entities.DTOs.ProjectTeamDtos;

namespace Entities.DTOs.ProjectDtos
{
    public class GetProjectDto
    {
        public long Id { get; set; }
        public string ProjectName { get; set; }
        public string Description { get; set; }
        public ProjectType ProjectType { get; set; }
        public ProjectMemberDto ProjectLeader { get; set; }
        public BasicCustomerDto Customer { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime FinishDate { get; set; }
        public bool IsActive { get; set; }
    }
}
