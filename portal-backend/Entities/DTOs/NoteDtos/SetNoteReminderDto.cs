using System.Text.Json.Serialization;

namespace Entities.DTOs.NoteDtos
{
    public class SetNoteReminderDto
    {
        /// <summary>
        /// ISO-8601 tarih/saat. Örn: 2026-05-11T11:38:00+03:00. Null/boş => hatırlatıcı kaldır.
        /// </summary>
        [JsonPropertyName("reminderAt")]
        public string? ReminderAt { get; set; }
    }
}

