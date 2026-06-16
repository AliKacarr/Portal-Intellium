using Business.Repository.UserJobDetailsRepository.Constans;
using Business.Repository.UserRepository.Constants;
using DataAccess.Repository.UserJobDetailRepository;
using DataAccess.Repository.UserRepository;
using Entities.Concrete;
using FluentValidation;

namespace Business.Repository.UserJobDetailsRepository.Validations
{
	public class UpdateUserJobDetailValidator : AbstractValidator<UserJobDetail>
	{
		private readonly IUserJobDetailDal _userJobDetailDal;
		private readonly IUserDal _userDal;

		public UpdateUserJobDetailValidator(IUserJobDetailDal userJobDetailDal, IUserDal userDal)
		{
			_userJobDetailDal = userJobDetailDal;
			_userDal = userDal;

			RuleFor(u => u.Id).Must(UserJobDetailExists).WithMessage(UserJobDetailsMessages.UserJobDetailNotFound);
			RuleFor(p => p.UserId).Must(UserExists).WithMessage(UserMessages.UserNotFound);
		}

		private bool UserJobDetailExists(long id)
		{
			return _userJobDetailDal.Get(u => u.Id == id) != null;
		}
		private bool UserExists(long userId)
		{
			return _userDal.Get(u => u.Id == userId) != null;
		}
	}
}
