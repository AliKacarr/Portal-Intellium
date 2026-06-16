using Business.LogTools;
using Castle.DynamicProxy;
using Core.Utilities.Interceptors;
using Core.Utilities.IoC;
using Entities.Concrete.Logs;
using Microsoft.Extensions.DependencyInjection;

namespace Business.BusinessAspects
{
	public class LoggerAspect : MethodInterception
	{
		private readonly IUserActivityProvider? _userActivityProvider;
		private readonly IExceptionProvider? _exceptionProvider;
		private bool isSuccess = false;
		private bool isLogin = false;
		private bool error = false;

		public LoggerAspect()
		{
			_userActivityProvider = ServiceTool.ServiceProvider.GetService<IUserActivityProvider>();
			_exceptionProvider = ServiceTool.ServiceProvider.GetService<IExceptionProvider>();
		}

		protected override void OnBefore(IInvocation invocation)
		{
			try
			{
				isLogin = _userActivityProvider?.IsLogin(invocation) ?? false;
				error = false;
			}
			catch
			{
				// Log altyapısı hazır değilse iş akışını bozma.
				isLogin = false;
				error = false;
			}
		}
		protected override void OnException(IInvocation invocation, Exception e)
		{
			try
			{
				long sessionID = _userActivityProvider?.SessionCreator(invocation, isLogin, false) ?? 0;
				int statusCode = _exceptionProvider?.GetStatusCode(e) ?? 500;
				UserActivity activity = _userActivityProvider?.ActivityCreator(invocation, isLogin, false, sessionID) ?? new UserActivity();
				long activityID = _userActivityProvider?.AddForError(statusCode, activity) ?? 0;
				_exceptionProvider?.SaveError(e, activityID);
				error = true;
			}
			catch
			{
				// Sessions/Logs tabloları yoksa 500 üretmesin.
				error = true;
			}
		}

		protected override void OnAfter(IInvocation invocation)
		{
			if (error == true) return;
			try
			{
				isSuccess = _userActivityProvider?.IsSucces(invocation) ?? false;
				long sessionID = _userActivityProvider?.SessionCreator(invocation, isLogin, isSuccess) ?? 0;
				UserActivity activity = _userActivityProvider?.ActivityCreator(invocation, isLogin, isSuccess, sessionID) ?? new UserActivity();
				_userActivityProvider?.Add(invocation, isLogin, isSuccess, activity);
			}
			catch
			{
				// Log altyapısı veya session/activity kaydı hata verse bile ana işlemi (örn. login) başarısız sayma
			}
		}
	}
}
