using Entities.Concrete;
using Entities.DTOs.CustomerDtos;
using Entities.DTOs.UserDtos;
using System.Collections.Generic;

namespace Entities.DTOs.AuthDtos
{
    public class AuthUserDto : BaseUserDto
    {
        public BasicCustomerDto Customer { get; set; }
        public string AccessToken { get; set; }
        public string RefreshToken { get; set; }
        public DateTime Expiration { get; set; }
        public UserRole Role { get; set; }
        public string JobTitle { get; set; }
        public string? Department { get; set; }
        public string? ServiceArea { get; set; }
        public string Email { get; set; }
        public bool RequiresAgreementUpdate { get; set; }
        public List<long> RequiredAgreementIds { get; set; } = new();
    }
}
