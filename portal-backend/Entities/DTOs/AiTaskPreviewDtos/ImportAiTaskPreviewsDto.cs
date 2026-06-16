namespace Entities.DTOs.AiTaskPreviewDtos
{
    public class ImportAiTaskPreviewsDto
    {
        public string Email { get; set; }
        public string? SourceReference { get; set; }
        public List<ImportAiTaskPreviewItemDto> Items { get; set; }
    }
}
