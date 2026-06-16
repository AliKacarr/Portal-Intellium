using System.Text.Json.Serialization;

namespace Entities.DTOs.NoteDtos
{
    public class TagDto
    {
        [JsonPropertyName("id")]
        public string Id { get; set; }
        [JsonPropertyName("title")]
        public string Title { get; set; }
        [JsonPropertyName("colorCode")]
        public string ColorCode { get; set; }
    }
}
