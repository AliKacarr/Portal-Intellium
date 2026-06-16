using System;

namespace Entities.Concrete
{
    public class UserAgreement
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public long AgreementId { get; set; }
        public DateTime AcceptedAt { get; set; }

        public User User { get; set; }
        public Agreement Agreement { get; set; }
    }
}
