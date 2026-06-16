using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Helpers
{
    /// <summary>
    /// Portal kullanıcısının iş bölümü (Ar&amp;Ge / Merkez / Dış Kaynak) kapsamı.
    /// </summary>
    public sealed class PortalBolumScope
    {
        public static readonly string[] CanonicalBolumNames = { "Ar&Ge", "Merkez", "Dış Kaynak" };

        public string? BolumName { get; init; }
        public long? DepartmentId { get; init; }

        public static PortalBolumScope Resolve(PortalContext context, long userId)
        {
            var job = context.UserJobDetails
                .AsNoTracking()
                .Where(j => j.UserId == userId && j.IsActive)
                .OrderByDescending(j => j.StartDate ?? DateTime.MinValue)
                .FirstOrDefault();

            if (job == null)
                return new PortalBolumScope();

            var raw = (job.Department ?? job.ServiceArea ?? "").Trim();
            if (raw.Length == 0)
                return new PortalBolumScope();

            var bolumName = MatchCanonicalBolumName(raw) ?? raw;
            var departments = context.Departments.AsNoTracking().Where(d => d.IsActive).ToList();

            var dept = FindDepartment(departments, raw)
                       ?? FindDepartment(departments, bolumName);

            return new PortalBolumScope
            {
                BolumName = dept?.Name ?? bolumName,
                DepartmentId = dept?.Id
            };
        }

        private static Department? FindDepartment(List<Department> departments, string? label)
        {
            if (string.IsNullOrWhiteSpace(label))
                return null;

            var normalized = NormalizeBolumLabel(label);
            return departments.FirstOrDefault(d =>
            {
                var dn = d.Name?.Trim();
                if (string.IsNullOrEmpty(dn))
                    return false;
                if (string.Equals(dn, label.Trim(), StringComparison.OrdinalIgnoreCase))
                    return true;
                return normalized != null
                       && string.Equals(NormalizeBolumLabel(dn), normalized, StringComparison.OrdinalIgnoreCase);
            });
        }

        /// <summary>Herkese açık içerik (bölüm atanmamış).</summary>
        public static bool IsEveryoneContent(
            bool isGeneral,
            long? departmentId,
            string? serviceArea,
            string? departmentName = null)
        {
            if (!isGeneral)
                return false;
            if (departmentId is > 0)
                return false;
            if (!string.IsNullOrWhiteSpace(serviceArea))
                return false;
            if (!string.IsNullOrWhiteSpace(departmentName))
                return false;
            return true;
        }

        public bool CanSee(bool isGeneral, long? departmentId, string? departmentName, string? serviceArea)
        {
            if (IsEveryoneContent(isGeneral, departmentId, serviceArea, departmentName))
                return true;

            return MatchesBolum(departmentId, departmentName, serviceArea);
        }

        /// <summary>
        /// Anket görünürlüğü: yalnızca DepartmentId ile eşleşir (isim tahmini yok).
        /// DepartmentId doluysa IsGeneral bayrağı yok sayılır.
        /// </summary>
        public bool CanSeePoll(bool isGeneral, long? departmentId, string? departmentName)
        {
            if (departmentId is > 0)
            {
                if (!DepartmentId.HasValue)
                    return false;
                return departmentId.Value == DepartmentId.Value;
            }

            return isGeneral;
        }

        /// <summary>
        /// Anket listesi için EF filtresi: herkese açık (DepartmentId yok) veya kullanıcının bölüm id'si.
        /// </summary>
        public static IQueryable<Poll> ApplyPollVisibilityFilter(IQueryable<Poll> query, PortalBolumScope scope)
        {
            if (scope.DepartmentId.HasValue)
            {
                var userDeptId = scope.DepartmentId.Value;
                return query.Where(p =>
                    (p.IsGeneral && (p.DepartmentId == null || p.DepartmentId == 0))
                    || p.DepartmentId == userDeptId);
            }

            return query.Where(p =>
                p.IsGeneral && (p.DepartmentId == null || p.DepartmentId == 0));
        }

        private bool MatchesBolum(long? contentDepartmentId, string? departmentName, string? serviceArea)
        {
            if (string.IsNullOrWhiteSpace(BolumName) && !DepartmentId.HasValue)
                return false;

            if (DepartmentId.HasValue && contentDepartmentId is > 0 && contentDepartmentId == DepartmentId)
                return true;

            var contentLabel = NormalizeBolumLabel(departmentName) ?? NormalizeBolumLabel(serviceArea);
            var userLabel = NormalizeBolumLabel(BolumName);
            if (string.IsNullOrEmpty(contentLabel) || string.IsNullOrEmpty(userLabel))
                return false;

            return string.Equals(contentLabel, userLabel, StringComparison.OrdinalIgnoreCase);
        }

        public static string? NormalizeBolumLabel(string? raw)
        {
            if (string.IsNullOrWhiteSpace(raw))
                return null;
            return MatchCanonicalBolumName(raw.Trim()) ?? raw.Trim();
        }

        public static string? MatchCanonicalBolumName(string raw)
        {
            if (string.IsNullOrWhiteSpace(raw))
                return null;

            var t = raw.Trim();
            foreach (var name in CanonicalBolumNames)
            {
                if (string.Equals(name, t, StringComparison.OrdinalIgnoreCase))
                    return name;
            }

            var lower = t.ToLowerInvariant();
            var compact = lower.Replace(" ", "").Replace("&", "");

            if (lower.Contains("ar&ge") || lower.Contains("ar-ge") || lower.Contains("ar ge")
                || compact == "arge" || compact == "arige")
                return "Ar&Ge";

            if (lower.Contains("merkez"))
                return "Merkez";

            if (lower.Contains("dış kaynak") || lower.Contains("dis kaynak")
                || compact.Contains("dışkaynak") || compact.Contains("diskaynak")
                || lower.Contains("outsource") || lower.Contains("outsourced"))
                return "Dış Kaynak";

            return null;
        }
    }
}
