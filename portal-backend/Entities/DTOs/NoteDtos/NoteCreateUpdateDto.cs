using System.Collections.Generic;
using System.Text.Json.Serialization;
using Entities.Converters;

namespace Entities.DTOs.NoteDtos
{
    public class NoteCreateUpdateDto
    {
        [JsonPropertyName("title")]
        public string Title { get; set; }
        [JsonPropertyName("folderId")]
        public string FolderId { get; set; }
        [JsonPropertyName("folderIds")]
        [JsonConverter(typeof(TagIdsJsonConverter))]
        public List<string> FolderIds { get; set; }
        [JsonPropertyName("folderPath")]
        public string FolderPath { get; set; }
        [JsonPropertyName("tagIds")]
        [JsonConverter(typeof(TagIdsJsonConverter))]
        public List<string> TagIds { get; set; }
        [JsonPropertyName("content")]
        public string Content { get; set; }
        [JsonPropertyName("taskId")]
        public int? TaskId { get; set; }
        [JsonPropertyName("isFavorite")]
        public bool? IsFavorite { get; set; }
        [JsonPropertyName("isDeleted")]
        public bool? IsDeleted { get; set; }
    }
}
