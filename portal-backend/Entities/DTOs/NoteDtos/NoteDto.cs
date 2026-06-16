using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Entities.DTOs.NoteDtos
{
    public class NoteDto
    {
        [JsonPropertyName("id")]
        public string Id { get; set; }
        [JsonPropertyName("title")]
        public string Title { get; set; }
        [JsonPropertyName("folderId")]
        public string FolderId { get; set; }
        [JsonPropertyName("folderIds")]
        public List<string> FolderIds { get; set; } = new();
        [JsonPropertyName("folderPath")]
        public string FolderPath { get; set; }
        [JsonPropertyName("tagIds")]
        public List<string> TagIds { get; set; } = new();

        // Paylaşılan notlarda bile tag başlığı/renk görünsün diye
        [JsonPropertyName("tags")]
        public List<TagDto> Tags { get; set; } = new();
        [JsonPropertyName("updatedAt")]
        public string UpdatedAt { get; set; }
        [JsonPropertyName("createdAt")]
        public string CreatedAt { get; set; }
        [JsonPropertyName("content")]
        public string Content { get; set; }
        [JsonPropertyName("isFavorite")]
        public bool IsFavorite { get; set; }
        [JsonPropertyName("isPinned")]
        public bool IsPinned { get; set; }
        [JsonPropertyName("isDeleted")]
        public bool IsDeleted { get; set; }
        [JsonPropertyName("sharedBy")]
        public string SharedBy { get; set; }

        [JsonPropertyName("taskId")]
        public int? TaskId { get; set; }

        // Paylaşılan notlarda düzenleme yetkisini frontend'in kolayca anlayabilmesi için
        [JsonPropertyName("readOnly")]
        public bool ReadOnly { get; set; }

        /// <summary>Hatırlatıcı zamanı (ISO-8601). Null ise yok.</summary>
        [JsonPropertyName("reminderAt")]
        public string? ReminderAt { get; set; }

        /// <summary>Bu nota ait hatırlatıcılar (ISO-8601).</summary>
        [JsonPropertyName("reminders")]
        public List<NoteReminderDto> Reminders { get; set; } = new();
    }
}
