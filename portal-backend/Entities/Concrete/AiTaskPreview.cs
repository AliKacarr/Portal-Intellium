namespace Entities.Concrete
{
    public class AiTaskPreview
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public int TaskListId { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public DateTime? DueDate { get; set; }
        public string Status { get; set; }
        public string? SourceReference { get; set; }
        public int? AppliedTaskId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime? ApprovedAt { get; set; }
    }
}
