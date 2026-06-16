using System;

namespace Entities.Concrete
{
    public class Permission
    {
        public long Id { get; set; }
        public long UserId { get; set; }

        /// <summary>
        /// PermissionTypes tablosundaki Id'ye FK.
        /// Eski string PermissionType alanının yerini almıştır.
        /// </summary>
        public int PermissionTypeId { get; set; }

        /// <summary>Navigation property — PermissionType detayına erişir.</summary>
        public PermissionTypes? PermissionTypeRef { get; set; }

        public string Address { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string Description { get; set; }
        public bool? IsAllowed { get; set; } = false;
        public string? Status { get; set; } = "Pending";
        public string? DocumentPath { get; set; }
        public string? RejectReason { get; set; }

        /// <summary>Onayda yıllık bakiyeden değil bonus bakiyeden düşülen gün (geri alma için).</summary>
        public double LeaveTakenFromBonus { get; set; }

        // --- AVANS İZİN ---
        public bool IsAdvanceLeave { get; set; } = false;

        [System.ComponentModel.DataAnnotations.Schema.NotMapped]
        public bool IsAdvanceApproved { get; set; } = false;

        /// <summary>
        /// API/ön yüz: Eski string <c>PermissionType</c> kolonu kaldırıldıktan sonra JSON’da
        /// <c>permissionType</c> alanının dolu gelmesi için. Değerler: Avans, Ücretli, Ücretsiz, Mazeret izni.
        /// </summary>
        [System.ComponentModel.DataAnnotations.Schema.NotMapped]
        public string PermissionType => MapLeaveCategoryLabel(PermissionTypeId, IsAdvanceLeave);

        private static string MapLeaveCategoryLabel(int permissionTypeId, bool isAdvanceLeave)
        {
            if (isAdvanceLeave && permissionTypeId == 1) return "Avans";
            if (permissionTypeId == 1) return "Ücretli";
            if (permissionTypeId == 2) return "Ücretsiz";
            if (permissionTypeId != 1 && permissionTypeId != 2) return "Mazeret izni";
            return $"İzin türü ({permissionTypeId})";
        }

        public DateTime? CreatedAt { get; set; } = DateTime.Now;
        public DateTime? AdvanceLeaveConsentAt { get; set; }
    }
}


