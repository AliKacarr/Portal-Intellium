using System.Text.Json;

namespace Entities.DTOs.ExpenseDto
{
    public class UpsertExpenseDraftSnapshotRequestDto
    {
        public string? DraftId { get; set; }
        public JsonElement Payload { get; set; }
    }
}

