using Core.Extensions;
using Microsoft.AspNetCore.Http;

namespace Core.Identity
{
    public class UserContext : IUserContext
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public UserContext(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }
        public bool IsAuthenticated =>
            _httpContextAccessor
            .HttpContext?
            .User
            .Identity?
            .IsAuthenticated ?? false;
        public long UserId => 
            _httpContextAccessor
            .HttpContext
            .User
            .ClaimUserId();

        public string UserName => 
            _httpContextAccessor
            .HttpContext
            .User
            .ClaimUserName();

        public long CustomerId =>
            _httpContextAccessor
            .HttpContext
            .User
            .ClaimCustomerId();

        public string CustomerName =>
            _httpContextAccessor
            .HttpContext
            .User
            .ClaimCustomerName();

        public string RoleName =>
            _httpContextAccessor
            .HttpContext
            .User
            .ClaimRoleName();

    }
}
