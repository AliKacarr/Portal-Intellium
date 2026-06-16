using System.Collections.Generic;

namespace Entities.DTOs.AgreementDtos
{
    public class AcceptAgreementsDto
    {
        public List<long> AgreementIds { get; set; } = new();
    }
}
