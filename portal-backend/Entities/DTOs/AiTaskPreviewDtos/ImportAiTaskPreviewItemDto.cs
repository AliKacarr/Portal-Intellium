namespace Entities.DTOs.AiTaskPreviewDtos
{
    public class ImportAiTaskPreviewItemDto
    {
        public int TaskListId { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public DateTime? DueDate { get; set; }
    }
}
