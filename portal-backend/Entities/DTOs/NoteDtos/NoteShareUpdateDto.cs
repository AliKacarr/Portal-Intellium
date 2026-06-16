using System.Text.Json.Serialization;

namespace Entities.DTOs.NoteDtos
{
    public class NoteShareUpdateDto
    {
        [JsonPropertyName("readOnly")]
        public bool ReadOnly { get; set; }
    }
}

