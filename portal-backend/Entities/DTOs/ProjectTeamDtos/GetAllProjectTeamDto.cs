using Entities.DTOs.UserDtos;

namespace Entities.DTOs.ProjectTeamDtos
{
    public class GetAllProjectTeamDto
    {
        public long Id { get; set; }
        public string Name { get; set; }
        public string ProjectName { get; set; }
        public string Description { get; set; }
        public BaseUserDto ProjectLeader { get; set; }
        public List<ProjectTeamMemberDto> Members { get; set; }
    }
}
