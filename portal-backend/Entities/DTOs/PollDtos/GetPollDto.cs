namespace Entities.DTOs.PollDtos
{
    public class GetPollDto
    {
        public long Id { get; set; }
        public string Title { get; set; }
        public string? Content { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int ViewCount { get; set; }
        public int TotalParticipants { get; set; }
        public bool IsGeneral { get; set; }
        public bool IsActive { get; set; }
        public bool IsExpired { get; set; }
        public DateTime CreatedAt { get; set; }
        public long? DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
        public long CreatedById { get; set; }
        public string? CreatedByName { get; set; }
        public bool HasVoted { get; set; }
        public List<GetPollQuestionDto> Questions { get; set; } = new();
    }

    public class GetPollQuestionDto
    {
        public long Id { get; set; }
        public string Text { get; set; }
        public int OrderIndex { get; set; }
        public bool HasVoted { get; set; }
        public long? UserVotedOptionId { get; set; }
        public List<PollOptionDto> Options { get; set; } = new();
    }

    public class PollOptionDto
    {
        public long Id { get; set; }
        public string Text { get; set; }
        public int VoteCount { get; set; }
        public double VotePercentage { get; set; }
    }

    public class PollListDto
    {
        public long Id { get; set; }
        public string Title { get; set; }
        public int QuestionCount { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int TotalParticipants { get; set; }
        public bool IsGeneral { get; set; }
        public bool IsActive { get; set; }
        public bool IsExpired { get; set; }
        public bool HasVoted { get; set; }
        public string? DepartmentName { get; set; }
        public string? CreatedByName { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
