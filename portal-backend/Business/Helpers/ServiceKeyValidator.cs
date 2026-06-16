using Microsoft.Extensions.Configuration;

namespace Business.Helpers
{
    public class ServiceKeyValidator : IServiceKeyValidator
    {
        private readonly IConfiguration _configuration;

        public ServiceKeyValidator(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public bool IsValid(string clientName, string? providedKey)
        {
            if (string.IsNullOrWhiteSpace(clientName) || string.IsNullOrWhiteSpace(providedKey))
                return false;

            var expectedKey = _configuration.GetSection($"ServiceKeys:{clientName}").Value;
            if (string.IsNullOrWhiteSpace(expectedKey))
                return false;

            return string.Equals(expectedKey, providedKey.Trim(), StringComparison.Ordinal);
        }
    }
}
