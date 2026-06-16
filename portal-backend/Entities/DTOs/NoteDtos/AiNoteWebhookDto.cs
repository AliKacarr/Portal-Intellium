using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Entities.DTOs.NoteDtos
{
    public class AiNoteWebhookDto
    {
        [JsonPropertyName("email")]
        public string Email { get; set; }

        [JsonPropertyName("folderName")]
        public string FolderName { get; set; }

        [JsonPropertyName("notes")]
        public List<AiWebhookNoteItemDto> Notes { get; set; }
    }

    public class AiWebhookNoteItemDto
    {
        [JsonPropertyName("title")]
        public string Title { get; set; }

        [JsonPropertyName("content")]
        public string Content { get; set; }
    }
}
