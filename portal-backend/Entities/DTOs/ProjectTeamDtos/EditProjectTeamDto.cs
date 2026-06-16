namespace Entities.DTOs.ProjectTeamDtos
{
    public class EditProjectTeamDto
    {
        public long Id { get; set; }
        public string Name { get; set; }
        public long ProjectId { get; set; }
        public string Description { get; set; }
        public List<AddProjectTeamMemberDto>? AddUserIds { get; set; }
        public List<long>? RemoveUserIds { get; set; }
    }
}
