using Entities.DTOs;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace DataAccess.Repository.MailRepository
{
    /// <summary>
    /// SMTP gönderimi MailKit ile (Exchange / Outlook SMTP uyumlu).
    /// </summary>
    public class EfMailDal : IMailDal
    {
        public void SendMail(SendMailDto sendMailDto)
        {
            if (sendMailDto?.MailParameters == null)
                throw new ArgumentNullException(nameof(sendMailDto.MailParameters));

            if (string.IsNullOrWhiteSpace(sendMailDto.ToEmail))
                throw new ArgumentException("Alıcı e-posta boş.", nameof(sendMailDto.ToEmail));

            var mp = sendMailDto.MailParameters;

            var host = (mp.SMTP ?? "").Trim();
            if (string.IsNullOrEmpty(host))
                throw new InvalidOperationException("MailParameters.SMTP boş.");

            int port = mp.Port > 0 ? mp.Port : (mp.SSL ? 587 : 25);

            var username = mp.User?.Trim();
            var password = (mp.Password ?? "").Replace(" ", "").Trim();

            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
                throw new InvalidOperationException("SMTP kullanıcı adı veya şifre boş.");

            var fromEmail = mp.FromEmail?.Trim();
            if (string.IsNullOrEmpty(fromEmail))
                throw new InvalidOperationException("FromEmail boş.");

            var fromName = string.IsNullOrWhiteSpace(mp.FromName)
                ? "Portal Intellium"
                : mp.FromName.Trim();

            var message = new MimeMessage();

            message.From.Add(new MailboxAddress(fromName, fromEmail));
            message.To.Add(MailboxAddress.Parse(sendMailDto.ToEmail.Trim()));
            message.Subject = sendMailDto.Subject ?? "";

            var builder = new BodyBuilder
            {
                HtmlBody = sendMailDto.Body ?? ""
            };

            message.Body = builder.ToMessageBody();

            using var client = new SmtpClient
            {
                Timeout = 120_000
            };

            client.AuthenticationMechanisms.Remove("XOAUTH2");

            var socketOptions = PickSecureSocketOptions(port, mp.SSL);

            try
            {
                client.Connect(host, port, socketOptions);
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException(
                    $"SMTP bağlanılamadı ({host}:{port}, {socketOptions}). Hata: {ex.Message}", ex);
            }

            try
            {
                client.Authenticate(username, password);
            }
            catch
            {
                var fallbackUser = $"{username}@{ExtractDomain(fromEmail)}";
                client.Authenticate(fallbackUser, password);
            }

            try
            {
                client.Send(message);
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Mail gönderilemedi. Hata: {ex.Message}", ex);
            }
            finally
            {
                client.Disconnect(true);
            }
        }

        private static SecureSocketOptions PickSecureSocketOptions(int port, bool sslFlag)
        {
            if (port == 465)
                return SecureSocketOptions.SslOnConnect;

            if (port == 587)
                return SecureSocketOptions.StartTls;

            if (sslFlag)
                return SecureSocketOptions.StartTls;

            return SecureSocketOptions.Auto;
        }

        private static string ExtractDomain(string email)
        {
            var index = email.IndexOf('@');
            return index > -1 ? email[(index + 1)..] : "";
        }
    }
}
