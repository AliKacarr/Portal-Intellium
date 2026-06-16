using System;
using Entities.Enums;

namespace Business.Helpers
{
    /// <summary>
    /// İzin türü (<c>PermissionTypes</c>) için yardımcı kurallar ve PDF/özet metinleri.
    /// <list type="bullet">
    /// <item><description><c>Id = 1</c> → Ücretli (yıllık ücretli izin)</description></item>
    /// <item><description><c>Id = 2</c> → Ücretsiz</description></item>
    /// <item><description>Diğer tüm Id değerleri → Mazeret veya özel tanımlar; görünen ad <c>SubPermission</c> üzerinden okunur.</description></item>
    /// </list>
    /// </summary>
    public static class PermissionTypeHelper
    {
        /// <summary>Saatlik: <see cref="PermissionDurationUnit.Hour"/> veya seed Id=7 / SubPermission’da "Saatlik".</summary>
        public static bool IsHourly(int id, string subPermission = null, short? durationUnit = null)
        {
            if (durationUnit.HasValue && durationUnit.Value == (short)PermissionDurationUnit.Hour)
                return true;
            if (id == 7) return true;
            return !string.IsNullOrWhiteSpace(subPermission)
                && subPermission.Trim().Contains("Saatlik", StringComparison.OrdinalIgnoreCase);
        }

        public static bool IsUcretsiz(int id) => id == 2;

        public static bool IsUcretli(int id) => id == 1;

        /// <summary>Seed’teki vefat türü (Id=4); özel mantık gerektiğinde kullanılır.</summary>
        public static bool IsVefat(int id) => id == 4;

        /// <summary>Ücretli ve ücretsiz dışındaki tüm türler (mazeret vb.).</summary>
        public static bool IsMazeret(int id) => id != 1 && id != 2;

        /// <summary>Yıllık ücretli izin bakiyesinden düşüm yapılır; ücretsiz ve mazeret türleri muaf.</summary>
        public static bool IsExemptFromBalance(int id) => !IsUcretli(id);

        /// <summary>Avans kontrolü yalnızca yıllık ücretli izinde.</summary>
        public static bool IsSubjectToAdvanceCheck(int id) => IsUcretli(id);

        public static string GetPdfTitle(int id, bool isAdvanceLeave, string subPermission = null, short? durationUnit = null)
        {
            if (IsHourly(id, subPermission, durationUnit))
                return "SAATLİK İZİN FORMU";
            if (isAdvanceLeave)
                return "YILLIK İZİN HAKKI OLMAYAN PERSONEL İZİN TALEP FORMU";
            if (IsUcretsiz(id))
                return "ÜCRETSİZ İZİN TALEP FORMU";
            if (IsMazeret(id))
            {
                if (!string.IsNullOrWhiteSpace(subPermission))
                    return subPermission.Trim();
                return "PERSONEL MAZERET İZİN BELGESİ";
            }
            return "YILLIK ÜCRETLİ İZİN TALEP VE ONAY FORMU";
        }

        public static string GetFormCode(int id, bool isAdvanceLeave, string subPermission = null, short? durationUnit = null)
        {
            if (IsHourly(id, subPermission, durationUnit))
                return "IK-004 Saatlik izin talep formu";
            if (isAdvanceLeave)
                return "IK-003 Yıllık izin hakkı olmayan personel için izin talep formu";
            if (IsUcretsiz(id))
                return "IK-005 Ücretsiz izin talep formu";
            if (IsMazeret(id))
            {
                if (!string.IsNullOrWhiteSpace(subPermission))
                    return $"IK-002 Mazeret İzin Formu — {subPermission.Trim()}";
                return "IK-002 Mazeret İzin Formu";
            }
            return "IK-001 Yıllık ücretli izin talep ve onay formu";
        }

        public static string GetTemplateName(int id, bool isAdvanceLeave, string subPermission = null, short? durationUnit = null)
        {
            if (isAdvanceLeave)
                return "IK003-_izin_hakkı_olmayan_personel_izin_talep_formu.pdf";
            if (IsHourly(id, subPermission, durationUnit))
                return "IK004-saatlik_izin_formu.pdf";
            if (IsMazeret(id))
                return "mazeret_izin_formu.pdf";
            if (IsUcretsiz(id))
                return "ucretsiz_izin_formu.pdf";
            return "ucretli_izin_formu.pdf";
        }

        /// <summary>
        /// LeaveDeducation gibi string bazlı eski akışlar için ana izin kategorisini döndürür.
        /// </summary>
        public static string GetPermissionCategory(int id)
        {
            if (IsUcretli(id)) return "Ücretli";
            if (IsUcretsiz(id)) return "Ücretsiz";
            if (IsMazeret(id)) return "Mazeret";
            return "Ücretli";
        }

        /// <summary>Özet tablolar ve listeler için okunabilir tür adı.</summary>
        public static string GetPermissionTypeDisplayName(int id, string subPermission = null)
        {
            if (IsUcretli(id))
                return "Yıllık ücretli izin";
            if (IsUcretsiz(id))
                return "Ücretsiz izin";
            if (!string.IsNullOrWhiteSpace(subPermission))
                return subPermission.Trim();
            return $"İzin türü ({id})";
        }
    }
}
