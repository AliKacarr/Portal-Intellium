namespace Entities.DTOs.PermissionTypeDtos
{
    public class PermissionTypeDto
    {
        public int Id { get; set; }
        public string Permission { get; set; }
        public string SubPermission { get; set; }

        /// <summary>1 = gün, 2 = saat</summary>
        public short DurationUnit { get; set; }
        public decimal? MaxDuration { get; set; }
        public decimal? MinDuration { get; set; }

        public string? LegalBasis { get; set; }
        public string? IsPaid { get; set; }
        public bool IsDivisible { get; set; }
        public bool RequiresDocument { get; set; }
        public string? Description { get; set; }
        public bool IsPriority { get; set; }
        public bool IsDeleteable { get; set; }
    }
}
