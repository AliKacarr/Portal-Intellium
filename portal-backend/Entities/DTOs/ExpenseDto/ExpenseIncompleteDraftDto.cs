using System.Text.Json;

namespace Entities.DTOs.ExpenseDto
{
    public class ExpenseIncompleteDraftDto
    {
        public string Id { get; set; } = string.Empty;
        public string Status { get; set; } = "Tamamlanmamış";
        public DateTime? PeriodEndAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        /// <summary>Ham snapshot JSON (parse edilebilir).</summary>
        public JsonElement PayloadJson { get; set; }
    }
}

