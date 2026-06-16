using Castle.DynamicProxy;
using Core.Extensions;
using Core.Identity;
using Core.Utilities.Interceptors;
using Core.Utilities.IoC;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;

namespace Business.BusinessAspects
{
    public class SecuredOperation : MethodInterception
    {
        private readonly string[] _roles;
        private readonly IHttpContextAccessor? _httpContextAccessor;

        public SecuredOperation(string roles)
        {
            _roles = (roles ?? string.Empty)
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(r => r.Trim())
                .Where(r => !string.IsNullOrWhiteSpace(r))
                .ToArray();

            _httpContextAccessor = ServiceTool.ServiceProvider.GetService<IHttpContextAccessor>();
        }

        protected override void OnBefore(IInvocation invocation)//uygulama çalışmadan önce kullanıcı yetkisini kontrol eder
        {
            var httpContext = _httpContextAccessor?.HttpContext;
            var user = httpContext?.User;
            if (user == null) throw new UnauthorizedAccessException("Giriş yapmalısınız.");

            var roleClaims = user.ClaimRoles() ?? new List<string>();
            var normalizedClaims = Normalize(roleClaims);
            ApplyRoleAliases(normalizedClaims);

            foreach (var role in _roles)
            {
                var normalizedRole = role.ToLowerInvariant();
                if (normalizedClaims.Contains(normalizedRole))
                {
                    return;
                }
            }

            var required = string.Join(", ", _roles.Select(r => r.Trim().ToLowerInvariant()));
            var actual =
                normalizedClaims.Count == 0
                    ? "(hiç rol claim'i yok — oturum yok veya JWT içinde ClaimTypes.Role eksik/uyumsuz)"
                    : string.Join(", ", normalizedClaims.OrderBy(x => x));
            var op = invocation.Method?.DeclaringType != null
                ? $"{invocation.Method.DeclaringType.Name}.{invocation.Method.Name}"
                : invocation.Method?.Name ?? "?";

            throw new UnauthorizedAccessException(
                $"İşlem yapmaya yetkiniz yok. Erişilmek istenen işlem: «{op}». " +
                $"Bu işlem için kabul edilen rollerden biri gerekli: [{required}]. " +
                $"Oturumdaki roller (eşleştirme sonrası): [{actual}].");

        }

        private static HashSet<string> Normalize(IEnumerable<string> roles)
        {
            return new HashSet<string>(
                roles
                    .Where(r => !string.IsNullOrWhiteSpace(r))
                    .Select(r => r.Trim().ToLowerInvariant())
            );
        }

        private static void ApplyRoleAliases(HashSet<string> normalizedClaims)
        {
            // Rol alias'ları (davranış değişmesin diye mevcut mapping korunuyor).
            // "worker-outsource" ve legacy "worker-outsourced" -> "worker" kapılarından da geçebilmeli.
            var worker = RoleNames.Worker.ToLowerInvariant();
            var outsource = RoleNames.WorkerOutsource.ToLowerInvariant();
            var outsourcedLegacy = RoleNames.WorkerOutsourced.ToLowerInvariant();

            if (normalizedClaims.Contains(outsource) || normalizedClaims.Contains(outsourcedLegacy))
                normalizedClaims.Add(worker);
        }
    }
}
