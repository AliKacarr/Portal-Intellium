namespace Entities.DTOs.PollDtos
{
    public class VotePollDto
    {
        public long PollId { get; set; }
        public List<PollQuestionVoteDto> Votes { get; set; } = new();
    }

    public class PollQuestionVoteDto
    {
        public long PollQuestionId { get; set; }
        public long PollOptionId { get; set; }
    }
}
