namespace Entities.DTOs.PollDtos
{
    public class AddPollDto
    {
        public string Title { get; set; }
        public string? Content { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsGeneral { get; set; } = false;
        public long? DepartmentId { get; set; }
        public bool IsActive { get; set; } = true;
        public List<AddPollQuestionDto> Questions { get; set; } = new();
    }

    public class AddPollQuestionDto
    {
        public string Text { get; set; }
        public List<string> Options { get; set; } = new();
    }
}
