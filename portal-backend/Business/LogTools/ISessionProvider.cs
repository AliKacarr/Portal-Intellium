using Microsoft.AspNetCore.Http;

namespace Business.LogTools
{
	public interface ISessionProvider
	{
		long CreateForSuccesLogin(string token, IHttpContextAccessor _httpContextAccessor);
		long CreateForFailedLogin(IHttpContextAccessor _httpContextAccessor);
		long SessionCreate(IHttpContextAccessor _httpContextAccessor);
	}
}
