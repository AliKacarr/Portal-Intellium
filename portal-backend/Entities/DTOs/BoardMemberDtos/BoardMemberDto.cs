namespace Entities.DTOs.BoardMemberDtos
{
    public class BoardMemberDto
    {
        public int Id { get; set; }
        public long UserId { get; set; }
        public string Email { get; set; }
        public string Name { get; set; }
        public string? ImageUrl { get; set; }
    }
}
