using System.Text.Json;

namespace Entities.DTOs.ExpenseDto
{
    public class ExpenseDraftSnapshotDto
    {
        public string Id { get; set; } = string.Empty;
        public JsonElement PayloadJson { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}

