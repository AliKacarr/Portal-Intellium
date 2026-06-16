using System;

namespace Entities.Concrete
{
    public enum AgreementType
    {
        KVKK = 1,
        AcikRiza = 2
    }

    public class Agreement
    {
        public long Id { get; set; }
        public AgreementType Type { get; set; }
        public string Content { get; set; }
        public int Version { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
