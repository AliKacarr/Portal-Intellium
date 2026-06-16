using Entities.Concrete;

namespace Entities.DTOs
{
    public class SendMailDto
    {
        public MailParameters MailParameters { get; set; } = null!;

        public string ToEmail { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
    }
}
