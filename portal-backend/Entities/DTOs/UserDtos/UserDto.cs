using Entities.Concrete;
using Entities.DTOs.CustomerDtos;

namespace Entities.DTOs.UserDtos
{
    public class UserDto : BaseUserDto
    {
        public string Email { get; set; }
        public string Language { get; set; }
        public BasicCustomerDto? Customer { get; set; }
        public UserRole? UserRole { get; set; }
        public DateTime AddetAt { get; set; }
        public DateTime? LegalConsentAcceptedAt { get; set; }
        public DateTime? KvkkAcceptedAt { get; set; }
        public int? KvkkVersion { get; set; }
        public DateTime? ExplicitConsentAcceptedAt { get; set; }
        public int? ExplicitConsentVersion { get; set; }
    }
}
