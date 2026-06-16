using System.Security.Claims;

namespace Core.Extensions
{
    public static class ClaimsExtensions
    {
        public static void AddNameIdentifier(this ICollection<Claim> claims, string nameIdentifier)
        {
            claims.Add(new Claim(ClaimTypes.NameIdentifier, nameIdentifier));
        }
        public static void AddName(this ICollection<Claim> claims, string name)
        {
            claims.Add(new Claim(ClaimTypes.Name, name));//Claims sınıfını genişlettik
        }

        public static void AddRoles(this ICollection<Claim> claims, string[] roles)
        {
            roles.ToList().ForEach(roles => claims.Add(new Claim(ClaimTypes.Role, roles)));
        }

        public static void AddCustomerName(this ICollection<Claim> claims, string customerName)
        {
            claims.Add(new Claim("CustomerName", customerName));
        }
        public static void AddCustomerId(this ICollection<Claim> claims, long customerId)
        {
            claims.Add(new Claim("CustomerId", customerId.ToString()));
        }

    }
}
