namespace Entities.DTOs.CvUserImportDtos
{
    public class CvUserImportBatchDto
    {
        public long Id { get; set; }
        public string Status { get; set; }
        public int TotalCount { get; set; }
        public int ProcessedCount { get; set; }
        public int FailedCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<CvUserImportItemDto> Items { get; set; } = new();
    }

    public class CvUserImportItemDto
    {
        public long Id { get; set; }
        public long BatchId { get; set; }
        public int SortOrder { get; set; }
        public string FileName { get; set; }
        public string Status { get; set; }
        public string? ErrorMessage { get; set; }
        public CvCandidateDto? Candidate { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public long? CreatedUserId { get; set; }
    }

    public class CreateUsersFromCvImportDto
    {
        public List<CreateUserFromCvCandidateDto> Candidates { get; set; } = new();
    }

    public class CreateUserFromCvCandidateDto
    {
        public long? ItemId { get; set; }
        public CvCandidateDto Candidate { get; set; } = new();
    }

    public class CreateUsersFromCvImportResultDto
    {
        public int CreatedCount { get; set; }
        public List<CreatedCvUserDto> CreatedUsers { get; set; } = new();
        public List<CvUserImportFailureDto> Failures { get; set; } = new();
    }

    public class CreatedCvUserDto
    {
        public long UserId { get; set; }
        public long? ItemId { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
    }

    public class CvUserImportFailureDto
    {
        public long? ItemId { get; set; }
        public string? FileName { get; set; }
        public string Message { get; set; }
    }

    public class DeleteCvUserImportItemsDto
    {
        public List<long> ItemIds { get; set; } = new();
    }
}
