using System.Text.Json.Serialization;

namespace Entities.DTOs.NoteDtos
{
    public class NoteReminderDto
    {
        [JsonPropertyName("id")]
        public string Id { get; set; }

        [JsonPropertyName("reminderAt")]
        public string ReminderAt { get; set; }

        [JsonPropertyName("sentAt")]
        public string? SentAt { get; set; }
    }
}

