using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Entities.DTOs
{
    public class ForgotPasswordDto
    {
        public string Value { get; set; }
        public string Password { get; set; }
        public DateTime? LegalConsentAcceptedAt { get; set; }
        public List<long> AgreementIds { get; set; } = new();
    }
}
