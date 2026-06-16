namespace Entities.Concrete
{
    public class PollVote
    {
        public long Id { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }

        public long PollId { get; set; }
        public long PollQuestionId { get; set; }
        public long PollOptionId { get; set; }
        public long UserId { get; set; }
    }
}
