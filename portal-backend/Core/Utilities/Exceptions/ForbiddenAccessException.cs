namespace Core.Utilities.Exceptions
{
    public class ForbiddenAccessException : Exception
    {
        public ForbiddenAccessException() : base("Bu eylemi gerçekleştirme izniniz yok.")
        {
        }

        public ForbiddenAccessException(string message) : base(message)
        {
        }

        public ForbiddenAccessException(string message, Exception innerException) : base(message, innerException)
        {
        }
    }
}
