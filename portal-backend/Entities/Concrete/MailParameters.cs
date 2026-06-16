namespace Entities.Concrete
{
    public class MailParameters
    {
        public long Id { get; set; }
        public long CustomerId { get; set; }

        // SMTP Server
        public string SMTP { get; set; } = string.Empty;
        public int Port { get; set; }
        public bool SSL { get; set; }

        // AUTH (kimlik doğrulama)
        public string User { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;

        // MAIL FROM (gönderici)
        public string FromEmail { get; set; } = string.Empty;
        public string FromName { get; set; } = string.Empty;
    }
}
