using Entities.Concrete;
using FluentValidation;

namespace Business.Repository.UserRepository.Validation
{
	public class UserValidator : AbstractValidator<User>
	{
		public UserValidator()
		{
			RuleFor(p => p.Name).NotEmpty().WithMessage("Kullanıcı adı boş olamaz!");
			RuleFor(p => p.Name).MinimumLength(3).WithMessage("Kullanıcı adı en az 3 karakter olmalıdır!");
			RuleFor(P => P.Email).NotEmpty().WithMessage("Mail boş olamaz!");
			RuleFor(P => P.Email).EmailAddress().WithMessage("Geçerli bir mail adresi yazınız!");
		}
	}
}
