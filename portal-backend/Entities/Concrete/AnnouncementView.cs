namespace Entities.Concrete
{
    public class AnnouncementView
    {
        public long Id { get; set; }
        public long AnnouncementId { get; set; }
        public long UserId { get; set; }
        public DateTime ViewedAt { get; set; }

        public Announcement Announcement { get; set; }
        public User User { get; set; }
    }
}
