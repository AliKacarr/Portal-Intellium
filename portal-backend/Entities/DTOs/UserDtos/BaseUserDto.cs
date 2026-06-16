namespace Entities.DTOs.UserDtos
{
    public class BaseUserDto
    {
        public long Id { get; set; }
        public string Name { get; set; }
        public bool IsActive { get; set; }
        public string? ImageUrl { get; set; }
    }
}
