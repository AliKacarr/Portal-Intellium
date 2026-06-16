namespace Entities.Concrete
{
    public class NewsView
    {
        public long Id { get; set; }
        public long NewsId { get; set; }
        public long UserId { get; set; }
        public DateTime ViewedAt { get; set; }

        public News News { get; set; }
        public User User { get; set; }
    }
}
