namespace Entities.DTOs.AuthDtos
{
    public class UserOperationClaimDto
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public long OperationClaimId { get; set; }
        public string OperationName { get; set; }

    }
}
