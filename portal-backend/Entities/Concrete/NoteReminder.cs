using System;

namespace Entities.Concrete
{
    public class NoteReminder
    {
        public Guid Id { get; set; }
        public Guid NoteId { get; set; }
        public long UserId { get; set; }

        /// <summary>Hatırlatıcı zamanı (UTC).</summary>
        public DateTime ReminderAtUtc { get; set; }

        /// <summary>Gönderildiği an (UTC). Null ise henüz gönderilmedi.</summary>
        public DateTime? SentAtUtc { get; set; }

        public DateTime CreatedAtUtc { get; set; }
    }
}

