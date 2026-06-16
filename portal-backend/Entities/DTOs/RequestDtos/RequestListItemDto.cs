using System;
using System.Text.Json.Serialization;

namespace Entities.DTOs.RequestDtos
{
    public class RequestListItemDto
    {
        public long Id { get; set; }
        public int CategoryId { get; set; }
        public string Category { get; set; } = string.Empty;
        public int? SubCategoryId { get; set; }
        public string? SubCategory { get; set; }
        public string? OtherText { get; set; }
        /// <summary>Talebi oluşturan kullanıcının görünen adı (Admin liste vb.).</summary>
        [JsonPropertyName("ownerName")]
        public string? OwnerName { get; set; }
        public string? Description { get; set; }
        public string Status { get; set; } = string.Empty;
        /// <summary>Admin inbox: ek bilgi sonrası kullanıcı yeniden gönderdiyse kısa uyarı.</summary>
        [JsonPropertyName("inboxHighlightText")]
        public string? InboxHighlightText { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}

