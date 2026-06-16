namespace Entities.Concrete
{
    public class UserOperationClaim
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public User User { get; set; }
        public long OperationClaimId { get; set; }
        public OperationClaim OperationClaim { get; set; }

    }
}
