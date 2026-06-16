namespace Entities.DTOs.PollDtos
{
    public class UpdatePollDto
    {
        public long Id { get; set; }
        public string Title { get; set; }
        public string? Content { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsGeneral { get; set; }
        public bool IsActive { get; set; }
        public long? DepartmentId { get; set; }
        public List<AddPollQuestionDto> Questions { get; set; } = new();
    }
}
