namespace Entities.DTOs.NotificationDtos
{
    public class AddNotificationDto
    {
        public string Title { get; set; }
        public string Content { get; set; }
        public string Type { get; set; }
        public long AssignedUserId { get; set; }
        
        /// <summary>İlişkili varlığın anahtarı (örn. requestId: re_...)</summary>
        public string? ReferenceId { get; set; }

        /// <summary>JSON: ek yönlendirme verisi (taskId, commentId vb.).</summary>
        public string? NavigationData { get; set; }
    }
}