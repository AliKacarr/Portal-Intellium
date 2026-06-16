using DataAccess.Repository.LogRepository;
using Entities.Concrete.Logs;
using Microsoft.AspNetCore.Http;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Business.LogTools
{
	public class SessionTool : ISessionProvider
	{
		private readonly ISessionDal _sessionDal;

		public SessionTool(ISessionDal sessionDal)
		{
			_sessionDal = sessionDal;
		}

		public long CreateForFailedLogin(IHttpContextAccessor _httpContextAccessor)
		{
			Session session = new();
			session.IPAddress = _httpContextAccessor.HttpContext?.Connection?.RemoteIpAddress?.ToString() ?? "";
			session.UserAgent = _httpContextAccessor.HttpContext?.Request?.Headers["User-Agent"].ToString() ?? "";
			var hashtext = (session.IPAddress ?? "") + (session.UserAgent ?? "");
			session.SessionHash = BitConverter
			.ToString(SHA256.HashData(Encoding.UTF8.GetBytes(hashtext)))
			.Replace("-", "")
			.ToLower();
			session.Token = "null";
			session.Username = "null";
			session.UserId = 0;
			long id = _sessionDal.AddForFail(session);
			return id;
		}

		public long CreateForSuccesLogin(string token, IHttpContextAccessor _httpContextAccessor)
		{
			Session session = new();
			session.IPAddress = _httpContextAccessor.HttpContext?.Connection?.RemoteIpAddress?.ToString() ?? "";
			session.UserAgent = _httpContextAccessor.HttpContext?.Request?.Headers["User-Agent"].ToString() ?? "";
			var hashtext = (session.IPAddress ?? "") + (session.UserAgent ?? "");
			session.SessionHash = BitConverter
			.ToString(SHA256.HashData(Encoding.UTF8.GetBytes(hashtext)))
			.Replace("-", "")
			.ToLower();
			session.Token = "null";
			session.Username = "null";
			session.UserId = 0;

			if (!string.IsNullOrEmpty(token))
			{
				try
				{
					session.Token = token;
					var jwtHandler = new JwtSecurityTokenHandler();
					var jwtToken = jwtHandler.ReadJwtToken(token);
					session.Username = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Name) != null ? jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Name).Value : "Geçersiz Token";
					session.UserId = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier) != null ? long.Parse(jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier).Value) : 0;
				}
				catch (Exception ex) { }
			}
			long id = _sessionDal.AddForSuccesLogin(session);
			return id;
		}

		public long SessionCreate(IHttpContextAccessor _httpContextAccessor)
		{
			Session session = new();
			long id;
			session.IPAddress = _httpContextAccessor.HttpContext?.Connection?.RemoteIpAddress?.ToString() ?? "";
			session.UserAgent = _httpContextAccessor.HttpContext?.Request?.Headers["User-Agent"].ToString() ?? "";
			var hashtext = (session.IPAddress ?? "") + (session.UserAgent ?? "");
			session.SessionHash = BitConverter
			.ToString(SHA256.HashData(Encoding.UTF8.GetBytes(hashtext)))
			.Replace("-", "")
			.ToLower();
			session.Token = "null";
			session.Username = "null";
			session.UserId = 0;
			var token = _httpContextAccessor.HttpContext?.Request?.Headers["Authorization"].ToString().Replace("Bearer ", "");
			if (!string.IsNullOrEmpty(token))
			{

				session.Token = token;
				try
				{
					var jwtHandler = new JwtSecurityTokenHandler();
					var jwtToken = jwtHandler.ReadJwtToken(token);
					session.Username = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Name) != null ? jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Name).Value : "Geçersiz Token";
					session.UserId = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier) != null ? long.Parse(jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier).Value) : 0;
					id = _sessionDal.AddForTask(session);
				}
				catch
				{
					id = _sessionDal.AddForFail(session);
				}
			}
			else
			{
				id = _sessionDal.AddForFail(session);
			}
			return id;
		}
	}
}

