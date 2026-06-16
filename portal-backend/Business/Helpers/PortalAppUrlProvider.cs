using Business.Configuration;
using Microsoft.Extensions.Options;

namespace Business.Helpers
{
    public sealed class PortalAppUrlProvider : IPortalAppUrlProvider
    {
        private readonly IOptions<PortalAppSettings> _options;

        public PortalAppUrlProvider(IOptions<PortalAppSettings> options)
        {
            _options = options;
        }

        public string GetAppBaseUrl()
        {
            var raw = _options.Value?.AppUrl;
            if (string.IsNullOrWhiteSpace(raw))
                return string.Empty;
            return raw.Trim().TrimEnd('/').TrimEnd();
        }

        public string GetEmailVerifyLinkPrefix()
        {
            var b = GetAppBaseUrl();
            return string.IsNullOrEmpty(b) ? string.Empty : $"{b}/email-verify?value=";
        }

        public string GetPasswordResetLinkPrefix()
        {
            var b = GetAppBaseUrl();
            return string.IsNullOrEmpty(b) ? string.Empty : $"{b}/reset-password?value=";
        }
    }
}
