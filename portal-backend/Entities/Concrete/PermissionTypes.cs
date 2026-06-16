using System.Collections.Generic;
using Entities.Enums;

namespace Entities.Concrete
{
    public class PermissionTypes
    {
        public int Id { get; set; }

        /// <summary>Ana kategori: "Ücretli", "Ücretsiz", "Mazeret"</summary>
        public string Permission { get; set; }

        /// <summary>Alt tür: "default", "Evlilik İzni", "Vefat İzni" vb.</summary>
        public string SubPermission { get; set; }

        /// <summary>1 = gün, 2 = saat (<see cref="PermissionDurationUnit"/>).</summary>
        public short DurationUnit { get; set; } = (short)PermissionDurationUnit.Day;

        /// <summary>
        /// Üst süre sınırı: <see cref="DurationUnit"/> gün ise gün, saat ise saat (örn. 3 gün veya 8 saat).
        /// Null = üst sınır yok.
        /// </summary>
        public decimal? MaxDuration { get; set; }

        /// <summary>
        /// Alt süre sınırı: saat modunda örn. 0,5 (30 dk); gün modunda genelde 1 veya 0,5 (yarım gün).
        /// Null = ek alt sınır yok (sadece pozitif süre).
        /// </summary>
        public decimal? MinDuration { get; set; }

        /// <summary>Yasal dayanak: 4857 İş Kanunu / SGK Mevzuatı / Şirket Politikası gibi</summary>
        public string? LegalBasis { get; set; }

        /// <summary>Ücret durumu: Ücretli / Ücretsiz / SGK</summary>
        public string? IsPaid { get; set; }

        /// <summary>Bölünebilir mi? Örn: Evlilik izni bölünemez (false).</summary>
        public bool IsDivisible { get; set; }

        /// <summary>Belge gerekli mi? Örn: Hastalık için rapor gereklidir (true).</summary>
        public bool RequiresDocument { get; set; }

        /// <summary>İzin hakkında açıklayıcı metin.</summary>
        public string? Description { get; set; }

        /// <summary>Öncelikli izin mi?</summary>
        public bool IsPriority { get; set; }

        /// <summary>Sistemden silinebilir mi? (Sistem izinleri silinemez)</summary>
        public bool IsDeleteable { get; set; }

        public ICollection<Permission> Permissions { get; set; }
    }
}
