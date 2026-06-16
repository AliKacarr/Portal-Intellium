namespace Business.Helpers
{
    public interface IServiceKeyValidator
    {
        bool IsValid(string clientName, string? providedKey);
    }
}
