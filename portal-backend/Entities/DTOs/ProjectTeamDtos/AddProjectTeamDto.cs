namespace Entities.DTOs.ProjectTeamDtos
{
    public class AddProjectTeamDto
    {
        public string Name { get; set; }
        public long ProjectId { get; set; }
        public string Description { get; set; }
        public List<AddProjectTeamMemberDto>? AddedUsers { get; set; }
    }
}
