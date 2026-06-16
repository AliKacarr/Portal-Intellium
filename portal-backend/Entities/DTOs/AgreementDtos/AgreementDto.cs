using System;

namespace Entities.DTOs.AgreementDtos
{
    public class AgreementDto
    {
        public long Id { get; set; }
        public int Type { get; set; }
        public string TypeName { get; set; }
        public string Content { get; set; }
        public int Version { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
