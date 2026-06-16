namespace Entities.Concrete
{
    public class UserRole
    {
        public long Id { get; set; }
        public string RoleName { get; set; }
        public string Description { get; set; }
        public DateTime AddedAt { get; set; } = DateTime.UtcNow;
    }
}
