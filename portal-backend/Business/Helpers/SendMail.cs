using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Mail;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using Entities.Concrete;

namespace Business.Helpers
{
    public class SendMail
    {
        public async Task<string> SendEmailAsync(string toEmail,string subject, string body)
        {
            
            try
            {
                var smtpClient = new SmtpClient("smtp.gmail.com")
                {
                    Port = 587,
                    Credentials = new NetworkCredential("yesaribaris23@gmail.com", "fffocazzgtefzkfd"),
                    EnableSsl = true,
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress("yesaribaris23@gmail.com"),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = false,
                };

                mailMessage.To.Add(toEmail);

                await smtpClient.SendMailAsync(mailMessage);

                return $"E-posta başarıyla gönderildi. Alıcı: {toEmail}";
            }
            catch (Exception ex)
            {
                return $"E-posta gönderme hatası: {ex.Message}";
            }
        }
    }
}
