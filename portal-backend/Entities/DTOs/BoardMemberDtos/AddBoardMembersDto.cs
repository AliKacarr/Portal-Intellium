namespace Entities.DTOs.BoardMemberDtos
{
    public class AddBoardMembersDto
    {
        public int BoardId { get; set; }
        public List<long> UserIds { get; set; }
    }
}
