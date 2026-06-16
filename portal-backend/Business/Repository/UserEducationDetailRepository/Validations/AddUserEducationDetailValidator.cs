using Business.Repository.UserRepository.Constants;
using DataAccess.Repository.UserRepository;
using Entities.Concrete;
using FluentValidation;

namespace Business.Repository.UserEducationDetailRepository.Validations
{
	public class AddUserEducationDetailValidator : AbstractValidator<UserEducationDetail>
	{
		private readonly IUserDal _userDal;

		public AddUserEducationDetailValidator(IUserDal userDal)
		{
			_userDal = userDal;

			RuleFor(p => p.UserId).Must(UserExists).WithMessage(UserMessages.UserNotFound);
		}

		private bool UserExists(long userId)
		{
			return _userDal.Get(u => u.Id == userId) != null;
		}
	}
}
