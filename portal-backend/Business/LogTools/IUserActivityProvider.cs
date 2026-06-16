using Castle.DynamicProxy;
using Entities.Concrete.Logs;

namespace Business.LogTools
{
	public interface IUserActivityProvider
	{
		bool IsLogin(IInvocation invocation);
		bool IsSucces(IInvocation invocation);
		long AddForError(int statusCode, UserActivity activity);
		void Add(IInvocation invocation, bool isLogin, bool isSuccess, UserActivity activity);
		UserActivity ActivityCreator(IInvocation invocation, bool isLogin, bool isSuccess, long sessionID);
		long SessionCreator(IInvocation invocation, bool isLogin, bool isSuccess);
	}
}
