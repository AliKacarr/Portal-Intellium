using Castle.DynamicProxy;
using Core.CrossCuttingConcerns.Caching;
using Core.Utilities.Interceptors;
using Core.Utilities.IoC;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Core.Aspects.Caching
{
    public class CacheAspect:MethodInterception
    {
        private int _duration;
        private ICacheManager _cacheManager;

        public CacheAspect(int duration=60)//60 dk cachede kalacak
        {
            _duration = duration;
            _cacheManager=ServiceTool.ServiceProvider.GetService<ICacheManager>();
            
        }

        public override void Intercept(IInvocation invocation)
        {
            var methodName= string.Format($"{invocation.Method.ReflectedType.FullName}.{invocation.Method.Name}");
            var arguments = invocation.Arguments.ToList();
            var key=$"{methodName}({string.Join(",",arguments.Select(x=>x?.ToString()??"<Null>"))})"; //cache kontrol eder
            if (_cacheManager.IsAdd(key))//daha önce sistemde bir cache varsa getirir.
            {
                invocation.ReturnValue=_cacheManager.Get(key);
                return;
            }
            invocation.Proceed();//cache yoksa hafızasında cache kayıt et ondan sonra veriyi getir. 
            _cacheManager.Add(key, invocation.ReturnValue, _duration);
        }
    }
}
