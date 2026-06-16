using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Entities.Concrete
{
    public class User
    {
        [Key]
        public long Id { get; set; }
        public string Email { get; set; }
        public string Name { get; set; }
        public string? ImageUrl { get; set; }
        public string Language { get; set; }
        public byte[]? PasswordSalt { get; set; }
        public byte[]? PasswordHash { get; set; }
        public string? ConfirmValue { get; set; }
        public DateTime? MailConfirmDate { get; set; }
        public bool MailConfirm { get; set; }
        public bool? IsConfirm { get; set; }
        public bool IsActive { get; set; }
        public string? ForgotPasswordValue { get; set; }
        public DateTime? ForgotPasswordRequestDate { get; set; }
        public DateTime AddetAt { get; set; }
        public DateTime? LegalConsentAcceptedAt { get; set; }
        [NotMapped]
        public DateTime BirthDate { get; set; }
        public bool? IsForgotPasswordComplete { get; set; }
        public ICollection<HealthInfo> HealthInfos { get; set; }
    }
}
