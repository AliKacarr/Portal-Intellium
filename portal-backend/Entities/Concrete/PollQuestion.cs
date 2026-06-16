namespace Entities.Concrete
{
    public class PollQuestion
    {
        public long Id { get; set; }
        public string Text { get; set; }
        public int OrderIndex { get; set; } = 0;
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }

        public long PollId { get; set; }
    }
}
