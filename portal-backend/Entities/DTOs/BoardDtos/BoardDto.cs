using Entities.Concrete;
using Entities.DTOs.BoardMemberDtos;
using Entities.DTOs.ProjectDtos;
using Entities.DTOs.UserDtos;

namespace Entities.DTOs.BoardDtos
{
    public class BoardDto
    {
        public int Id { get; set; }
        public BasicProjectDto Project { get; set; }
        public BoardCategory Category { get; set; }
        public BaseUserDto CreatedUser { get; set; }
        public List<BoardMemberDto> BoardMembers { get; set; }
        public string Name { get; set; }
        public string AvatarPath { get; set; }
        public bool PrivateToProjectMembers { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
    }
}
