namespace Entities.DTOs.AiTaskPreviewDtos
{
    public class AiTaskPreviewDto
    {
        public long Id { get; set; }
        public int BoardId { get; set; }
        public string BoardName { get; set; }
        public int TaskListId { get; set; }
        public string TaskListName { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public DateTime? DueDate { get; set; }
        public string Status { get; set; }
        public string? SourceReference { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
