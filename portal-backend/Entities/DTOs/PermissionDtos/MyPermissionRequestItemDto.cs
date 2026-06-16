using System;

namespace Entities.DTOs.PermissionDtos
{
    public class MyPermissionRequestItemDto
    {
        public long Id { get; set; }
        public int PermissionTypeId { get; set; }
        public string PermissionType { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string Description { get; set; }
        public string Status { get; set; }
        public bool? IsAllowed { get; set; }
        public string RejectReason { get; set; }
        public DateTime? CreatedAt { get; set; }

        /// <summary>UI'da "bildirim" alanında gösterilecek kısa açıklama.</summary>
        public string Info { get; set; }
    }
}

