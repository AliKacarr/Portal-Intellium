using Castle.DynamicProxy;
using Core.Utilities.Interceptors;
using System.Transactions;

namespace Core.Aspects.Autofac.Transaction
{
	public class TransactionScopeAspect : MethodInterception
	{
		public override void Intercept(IInvocation invocation)
		{
			using (TransactionScope transactionScope = new TransactionScope())
			{
				try
				{
					//işlemde hata yoksa
					invocation.Proceed(); //işleme devam et
					transactionScope.Complete();//işlemi tamamla
				}
				catch (Exception)
				{
					//işlmede herhangi bir hata varsa
					transactionScope.Dispose();//tüm yapılan işlmeleri geri al
					throw;
				}
			}
		}
	}
}
