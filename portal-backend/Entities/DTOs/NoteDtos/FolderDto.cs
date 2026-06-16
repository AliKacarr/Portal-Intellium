using System.Text.Json.Serialization;

namespace Entities.DTOs.NoteDtos
{
    public class FolderDto
    {
        [JsonPropertyName("id")]
        public string Id { get; set; }

        [JsonPropertyName("title")]
        public string Title { get; set; }
    }
}

