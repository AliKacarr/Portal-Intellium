using System;

namespace Entities.Concrete
{
    public class RequestStatusHistory
    {
        public long Id { get; set; }
        public long RequestId { get; set; }
        public string FromStatus { get; set; } = string.Empty;
        public string ToStatus { get; set; } = string.Empty;
        public long ActionByUserId { get; set; }
        public string? Note { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}

