namespace Entities.Concrete
{
    public class PollOption
    {
        public long Id { get; set; }
        public string Text { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }

        public long PollQuestionId { get; set; }
    }
}
