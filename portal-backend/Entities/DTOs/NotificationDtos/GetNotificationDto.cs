using System;
using System.Text.Json.Serialization;

namespace Entities.DTOs.NotificationDtos
{
    public class GetNotificationDto
    {
        public long Id { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public string Type { get; set; }
        public bool IsChecked { get; set; }

        [JsonPropertyName("createdAt")]
        [JsonConverter(typeof(UtcIsoDateTimeJsonConverter))]
        public DateTime CreatedAt { get; set; }

        /// <summary>Hedef varlık kimliği (haber/duyuru/anket/bilet/pano vb.).</summary>
        [JsonPropertyName("targetId")]
        public string? TargetId { get; set; }

        [JsonPropertyName("navigationData")]
        public string? NavigationData { get; set; }
    }
}
