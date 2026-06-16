using Entities.DTOs.ProjectDtos;

namespace Entities.DTOs.ProjectTeamDtos
{
    public class GetProjectTeamDto
    {
        public long Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public ProjectForProjectTeamDetailDto Project { get; set; }
        public List<ProjectTeamMemberDto> Members { get; set; }
    }
}
