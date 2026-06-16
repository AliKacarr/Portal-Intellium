using Business.Repository.UserRepository.Constants;
using DataAccess.Repository.UserRepository;
using Entities.Concrete;
using FluentValidation;

namespace Business.Repository.UserFamilyDetailRepository.Validations
{
	public class AddUserFamilyDetailValidator : AbstractValidator<UserFamilyDetail>
	{
		private readonly IUserDal _userDal;

		public AddUserFamilyDetailValidator(IUserDal userDal)
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
