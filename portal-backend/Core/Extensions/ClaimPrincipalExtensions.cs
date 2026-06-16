using System.Security.Claims;

namespace Core.Extensions
{
    public static class ClaimPrincipalExtensions
    {
        public static List<string> Claims(this ClaimsPrincipal claimsPrincipal, string claimType)
        {
            var result = claimsPrincipal.FindAll(claimType).Select(x => x.Value).ToList();
            return result;
        }

        public static List<string> ClaimRoles(this ClaimsPrincipal claimsPrincipal)
        {
            return claimsPrincipal.Claims(ClaimTypes.Role);
        }
        public static long ClaimUserId(this ClaimsPrincipal claimsPrincipal)
        {
            var userId = claimsPrincipal.FindFirst(ClaimTypes.NameIdentifier)!.Value;
            return long.Parse(userId);
        }
        public static string ClaimUserName(this ClaimsPrincipal claimsPrincipal)
        {
            return claimsPrincipal.FindFirst(ClaimTypes.Name)!.Value;
        }
        public static long ClaimCustomerId(this ClaimsPrincipal claimsPrincipal)
        {
            var customerId = claimsPrincipal.FindFirst("CustomerId")!.Value;
            return long.Parse(customerId);
        }
        public static string ClaimCustomerName(this ClaimsPrincipal claimsPrincipal)
        {
            return claimsPrincipal.FindFirst("CustomerName")!.Value;
        }
        public static string ClaimRoleName(this ClaimsPrincipal claimsPrincipal)
        {
            return claimsPrincipal.FindFirst(ClaimTypes.Role)!.Value;
        }
    }
}
