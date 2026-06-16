using System;

namespace Entities.DTOs
{
    /// <summary>Admin izin takvimi için özet (hangi günler kim, ne izni).</summary>
    public class AdminCalendarEventDto
    {
        public int PermissionId { get; set; }
        public long UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string? UserEmail { get; set; }
        public int PermissionTypeId { get; set; }
        public string PermissionTypeName { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string? Status { get; set; }
    }
}
