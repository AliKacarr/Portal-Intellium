using System;

namespace Entities.Concrete
{
    public class Notification
    {
        public long Id { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public string Type { get; set; }
        public DateTime CreatedDate { get; set; }
        public long AssignedUserId { get; set; }
        public bool IsChecked { get; set; }
        
        /// <summary>
        /// İlişkili varlığın anahtarı.
        /// Örn: requestId (re_...), projeId, ticketId vb. Frontend deep link için kullanılır.
        /// </summary>
        public string? ReferenceId { get; set; }

        /// <summary>JSON: ek route parametreleri (örn. taskId, commentId).</summary>
        public string? NavigationData { get; set; }
    }
}