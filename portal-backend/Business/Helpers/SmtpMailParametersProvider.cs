using Business.Configuration;
using Business.Repository.MailRepository;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Business.Helpers
{
    public sealed class SmtpMailParametersProvider : ISmtpMailParametersProvider
    {
        private readonly PortalContext _context;
        private readonly IMailParameterService _mailParameterService;
        private readonly IOptions<SmtpSettings> _smtpOptions;

        public SmtpMailParametersProvider(
            PortalContext context,
            IMailParameterService mailParameterService,
            IOptions<SmtpSettings> smtpOptions)
        {
            _context = context;
            _mailParameterService = mailParameterService;
            _smtpOptions = smtpOptions;
        }

        /// <summary>
        /// Önce <c>Smtp:*</c> (Host, User, Password) tam doluysa onu kullanır; sonra MailParameters tablosu.
        /// </summary>
        public MailParameters? GetUsableParameters()
        {
            var fromConfig = TryResolveFromConfiguration();
            if (fromConfig != null)
            {
                EnsureFromDefaults(fromConfig);
                return fromConfig;
            }

            var primary = _mailParameterService.GetParameters(1).Data;
            if (IsUsableMailParameters(primary))
            {
                var clone = Clone(primary!);
                EnsureFromDefaults(clone);
                return clone;
            }

            var rows = _context.MailParameters.AsNoTracking().OrderBy(m => m.CustomerId).ToList();
            foreach (var m in rows)
            {
                if (IsUsableMailParameters(m))
                {
                    var clone = Clone(m);
                    EnsureFromDefaults(clone);
                    return clone;
                }
            }

            return null;
        }

        private static MailParameters Clone(MailParameters m) =>
            new()
            {
                Id = m.Id,
                CustomerId = m.CustomerId,
                SMTP = m.SMTP,
                Port = m.Port,
                SSL = m.SSL,
                User = m.User,
                Password = m.Password,
                FromEmail = m.FromEmail,
                FromName = m.FromName
            };

        private MailParameters? TryResolveFromConfiguration()
        {
            var smtp = _smtpOptions.Value;
            var host = (smtp.Host ?? "").Trim();
            var user = (smtp.User ?? "").Trim();
            var password = NormalizePassword(smtp.Password);
            if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(user) || string.IsNullOrWhiteSpace(password))
                return null;

            var port = smtp.Port > 0 ? smtp.Port : 587;
            var ssl = smtp.Ssl;

            var fromEmail = (smtp.FromEmail ?? "").Trim();
            if (string.IsNullOrWhiteSpace(fromEmail))
                fromEmail = user;

            return new MailParameters
            {
                Id = 0,
                CustomerId = 0,
                User = user,
                Password = password,
                SMTP = host,
                Port = port,
                SSL = ssl,
                FromEmail = fromEmail,
                FromName = (smtp.FromName ?? "Portal Intellium").Trim()
            };
        }

        private static string NormalizePassword(string? raw)
        {
            return (raw ?? string.Empty).Replace(" ", "").Trim();
        }

        private static bool IsUsableMailParameters(MailParameters? m)
        {
            if (m == null) return false;
            if (string.IsNullOrWhiteSpace(m.SMTP) || string.IsNullOrWhiteSpace(m.User) || string.IsNullOrWhiteSpace(NormalizePassword(m.Password)))
                return false;
            return true;
        }

        private static void EnsureFromDefaults(MailParameters m)
        {
            if (string.IsNullOrWhiteSpace(m.FromEmail) && !string.IsNullOrWhiteSpace(m.User))
                m.FromEmail = m.User.Trim();
            if (string.IsNullOrWhiteSpace(m.FromName))
                m.FromName = "Portal Intellium";
        }
    }
}
