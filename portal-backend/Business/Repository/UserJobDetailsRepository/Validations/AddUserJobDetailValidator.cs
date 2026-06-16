using Business.Repository.UserRepository.Constants;
using DataAccess.Repository.UserRepository;
using Entities.Concrete;
using FluentValidation;

namespace Business.Repository.UserJobDetailsRepository.Validations
{
	public class AddUserJobDetailValidator : AbstractValidator<UserJobDetail>
	{
		private readonly IUserDal _userDal;

		public AddUserJobDetailValidator(IUserDal userDal)
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
