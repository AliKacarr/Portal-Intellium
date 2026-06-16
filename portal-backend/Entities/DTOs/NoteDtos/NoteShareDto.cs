using System.Text.Json.Serialization;

namespace Entities.DTOs.NoteDtos
{
    public class NoteShareDto
    {
        [JsonPropertyName("userId")]
        public long UserId { get; set; }

        [JsonPropertyName("readOnly")]
        public bool IsReadOnly { get; set; }
    }
}
