using Castle.DynamicProxy;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.LogRepository;
using Entities.Concrete.Logs;
using Entities.DTOs.AuthDtos;
using Microsoft.AspNetCore.Http;
using System.Text.Json;

namespace Business.LogTools
{
	public class UserActivityTool : IUserActivityProvider
	{
		private readonly IUserActivityDal _userActivityDal;
		private readonly IRequestUrlDal _requestUrlDal;
		private readonly ISessionProvider _sessionProvider;
		private readonly IHttpContextAccessor _httpContextAccessor;
		public UserActivityTool(IUserActivityDal userActivityDal, IRequestUrlDal requestUrlDal, ISessionProvider sessionProvider, IHttpContextAccessor httpContextAccessor)
		{
			_userActivityDal = userActivityDal;
			_requestUrlDal = requestUrlDal;
			_sessionProvider = sessionProvider;
			_httpContextAccessor = httpContextAccessor;
		}

		public UserActivity ActivityCreator(IInvocation invocation, bool isLogin, bool isSuccess, long sessionID)
		{
			var path = _httpContextAccessor.HttpContext?.Request?.Path.ToString()?.ToLower() ?? "/unknown";
			UserActivity activity = new()
			{
				SessionId = sessionID,
				Time = DateTime.Now,
				StatusCode = isSuccess ? 200 : 400,
				RequestUrlId = _requestUrlDal.AddForUserActivity(new RequestUrl() { Url = path })
			};
			var parameters = invocation.Arguments;
			string data = "";

			if (isLogin)
			{
				if (parameters[0].GetType() == typeof(UserForLoginDto))
				{
					UserForLoginDto maskedLogin = new();
					var obj = parameters[0] as UserForLoginDto;
					maskedLogin.Email = obj.Email;
					maskedLogin.Password = "";
					data = JsonSerializer.Serialize(maskedLogin, new JsonSerializerOptions { WriteIndented = true });
				}
			}
			else
			{
				if (parameters != null)
				{
					try
					{
						data = JsonSerializer.Serialize(invocation.Arguments, new JsonSerializerOptions { WriteIndented = true });
					}
					catch
					{
						data = "[Serialize edilemeyen parametre]";
					}
				}

			}
			activity.Payload = data ?? "";
			return activity;
		}

		public void Add(IInvocation invocation, bool isLogin, bool isSuccess, UserActivity activity)
		{
			string responce = "";
			var returnValue = invocation.ReturnValue;
			var returnType = returnValue.GetType();
			if (isSuccess && returnType.IsGenericType && returnType.GetGenericTypeDefinition() == typeof(SuccessDataResult<>))
			{
				if (!isLogin)
				{
					responce = JsonSerializer.Serialize(returnValue, new JsonSerializerOptions { WriteIndented = true });
				}
			}
			activity.Response = responce ?? "";
			_userActivityDal.Add(activity);
		}

		public long AddForError(int statusCode, UserActivity activity)
		{
			activity.StatusCode = statusCode;
			activity.Response = "";
			return _userActivityDal.AddForError(activity);
		}

		public bool IsLogin(IInvocation invocation)
		{
			var _httpContextAccessor = new HttpContextAccessor();
			var url = _httpContextAccessor.HttpContext?.Request?.Path.ToString();
			string loginUrl = "/api/auth/login";
			if (loginUrl == url)
			{
				return true;
			}
			return false;
		}


		public bool IsSucces(IInvocation invocation)
		{
			var returnValue = invocation.ReturnValue;

			if (returnValue != null)
			{
				var returnType = returnValue.GetType();
				if (returnType == typeof(ErrorResult))
				{
					return false;
				}

				else if (returnType.IsGenericType && returnType.GetGenericTypeDefinition() == typeof(ErrorDataResult<>))
				{
					return false;
				}

				else
				{
					return true;
				}
			}
			else
			{
				return false;
			}
		}

		public long SessionCreator(IInvocation invocation, bool isLogin, bool isSuccess)
		{
			long id = 0;
			if (isLogin)
			{
				if (isSuccess)
				{
					var returnValue = invocation.ReturnValue;

					if (returnValue is SuccessDataResult<AuthUserDto> result)
					{
						var token = result.Data.AccessToken;
						if (token != null)
						{
							id = _sessionProvider.CreateForSuccesLogin(token, _httpContextAccessor);
						}
					}
				}
				else
				{
					id = _sessionProvider.CreateForFailedLogin(_httpContextAccessor);
				}
			}
			else
			{
				id = _sessionProvider.SessionCreate(_httpContextAccessor);
			}
			return id;
		}
	}
}
