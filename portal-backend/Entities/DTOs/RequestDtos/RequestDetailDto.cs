using System;
using System.Collections.Generic;

namespace Entities.DTOs.RequestDtos
{
    public class RequestAttachmentDto
    {
        public long Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? ContentType { get; set; }
        public long SizeBytes { get; set; }
    }

    public class RequestStatusHistoryDto
    {
        public long Id { get; set; }
        public string FromStatus { get; set; } = string.Empty;
        public string ToStatus { get; set; } = string.Empty;
        public string? Note { get; set; }
        public long ActionByUserId { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class RequestDetailDto
    {
        public long Id { get; set; }
        /// <summary>Talebi oluşturan kullanıcı (detayda düzenleme yetkisi için).</summary>
        public long OwnerUserId { get; set; }
        public int CategoryId { get; set; }
        public string Category { get; set; } = string.Empty;
        public int SubCategoryId { get; set; }
        public string SubCategory { get; set; } = string.Empty;
        public string? OtherText { get; set; }
        public string? Description { get; set; }
        public string Status { get; set; } = string.Empty;
        public string PayloadJson { get; set; } = "{}";
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public List<RequestAttachmentDto> Attachments { get; set; } = new();
        public List<RequestStatusHistoryDto> History { get; set; } = new();
    }
}

