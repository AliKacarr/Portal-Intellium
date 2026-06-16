using Entities.Concrete;

namespace Business.Helpers
{
    /// <summary>
    /// MailParameters tablosu (CustomerId=1 veya uygun satır) veya appsettings <c>Smtp:*</c> ile kullanılabilir SMTP ayarı.
    /// </summary>
    public interface ISmtpMailParametersProvider
    {
        MailParameters? GetUsableParameters();
    }
}
