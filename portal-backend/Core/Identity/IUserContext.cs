namespace Core.Identity
{
    public interface IUserContext
    {
        bool IsAuthenticated { get; }
        long UserId { get; }
        string UserName { get; }
        long CustomerId { get; }
        string CustomerName { get; }
        string RoleName { get; }
    }
}
