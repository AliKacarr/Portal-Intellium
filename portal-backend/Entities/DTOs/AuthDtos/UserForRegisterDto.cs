namespace Entities.DTOs.AuthDtos
{
    public class UserForRegisterDto
    {
        public string Name { get; set; }
        public string Email { get; set; }
        public string Language { get; set; }
        public string Password { get; set; }
        public bool IsActive { get; set; }
        public long CustomerId { get; set; }
        public long UserRoleId { get; set; }
        public string? ImageUrl { get; set; }
        public DateTime AddetAt { get; set; }
    }
}
