namespace Entities.DTOs.RequestDtos
{
    public class UpdateRequestStatusDto
    {
        public string Status { get; set; } = string.Empty;
        public string? Note { get; set; }
        public long? AssignedToUserId { get; set; }
    }
}

