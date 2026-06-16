using System.Text.Json.Serialization;
using System.Text.Json;

namespace Entities.DTOs.ExpenseDto
{
    public class UpsertExpenseIncompleteDraftRequestDto
    {
        /// <summary>Mevcut draft id (uuid string). Null ise yeni oluşturulur.</summary>
        [JsonPropertyName("draftId")]
        public string? DraftId { get; set; }

        /// <summary>Frontend form snapshot'ı: userId, expenses[], items, tutarlar, imageData vb. tamamı (ham JSON). Fiş alanları için önce POST /api/expense/receipt/extract (Groq) ile öneri alınıp bu payload&apos;a işlenmelidir.</summary>
        [JsonPropertyName("payload")]
        public JsonElement Payload { get; set; }

        /// <summary>
        /// Opsiyonel: dönemin bitiş zamanı (UTC). Boşsa payload içinden türetilmeye çalışılır.
        /// </summary>
        [JsonPropertyName("periodEndAt")]
        public DateTime? PeriodEndAt { get; set; }
    }
}

