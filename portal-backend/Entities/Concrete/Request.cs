using System;

namespace Entities.Concrete
{
    public class Request
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public int CategoryId { get; set; }
        public int SubCategoryId { get; set; }

        /// <summary>
        /// Kategori/alt kategori "Diğer" seçilince zorunlu serbest metin.
        /// </summary>
        public string? OtherText { get; set; }

        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }

        /// <summary>
        /// Dinamik form alanları için esnek payload (json). Postgres: jsonb.
        /// </summary>
        public string PayloadJson { get; set; } = "{}";

        public TalepDurumu Status { get; set; } = TalepDurumu.Taslak;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public long? AssignedToUserId { get; set; }
        public long? LastActionByUserId { get; set; }
        public string? LastActionNote { get; set; }

        /// <summary>
        /// Ek bilgi beklendi; kullanıcı formu güncelleyip tekrar gönderdi. Admin inbox'ta vurgulamak için;
        /// admin durum güncelleyince sıfırlanır.
        /// </summary>
        public bool AdminHighlightUserResubmit { get; set; }
    }
}

