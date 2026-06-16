using Castle.DynamicProxy;
using Core.CrossCuttingConcerns.Validation;
using Core.Utilities.Interceptors;
using Core.Utilities.IoC;
using FluentValidation;

namespace Core.Aspects.Autofac.Validation
{
	public class ValidationAspect : MethodInterception
	{
		private readonly Type _validatorType;

		public ValidationAspect(Type validatorType)
		{
			if (!typeof(IValidator).IsAssignableFrom(validatorType))
			{
				throw new System.Exception("Hatalı tip");
			}

			_validatorType = validatorType;
		}

		protected override void OnBefore(IInvocation invocation)
		{
			var validator = (IValidator)ServiceTool.ServiceProvider.GetService(_validatorType)! ??
				throw new Exception($"Validator çözümlemesi başarısız: {_validatorType.Name}");

			var entityType = _validatorType.BaseType.GetGenericArguments()[0];
			var entities = invocation.Arguments.Where(t => t.GetType() == entityType);
			foreach (var entity in entities)
			{
				ValidationTool.Validate(validator, entity);
			}
		}
	}
}
