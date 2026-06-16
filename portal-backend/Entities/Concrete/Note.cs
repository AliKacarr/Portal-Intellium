using System;

namespace Entities.Concrete
{
    public class Note
    {
        public Guid Id { get; set; }
        public int? TaskId { get; set; }
        public long UserId { get; set; }
        public Guid? FolderId { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public DateTime CreatedAt { get; set; }
        public long CreatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public Guid? UpdatedBy { get; set; }
        public bool IsPrivate { get; set; }
        public bool IsShared { get; set; }
        public bool IsFavorite { get; set; }
        public bool IsPinned { get; set; }
        public bool IsDeleted { get; set; }

        /// <summary>
        /// Not bazlı hatırlatıcı zamanı (UTC). Null ise hatırlatıcı yoktur.
        /// </summary>
        public DateTime? ReminderAtUtc { get; set; }

        /// <summary>
        /// Hatırlatıcı gönderildiği an (UTC). Null ise henüz gönderilmedi.
        /// </summary>
        public DateTime? ReminderSentAtUtc { get; set; }
    }
}
