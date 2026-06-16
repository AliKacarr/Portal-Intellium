using Entities.Concrete;
using Entities.DTOs.UserDtos;

namespace Entities.DTOs.ProjectTeamDtos
{
    public class ProjectTeamMemberDto : BaseUserDto
    {
        public UserRole? UserRole { get; set; }
        public string ProjectRole { get; set; }
    }
}
