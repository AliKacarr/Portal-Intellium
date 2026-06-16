using Business.Repository.UserLanguageDetailRepository.Constans;
using Business.Repository.UserRepository.Constants;
using DataAccess.Repository.UserLanguageDetailRepository;
using DataAccess.Repository.UserRepository;
using Entities.Concrete;
using FluentValidation;

namespace Business.Repository.UserLanguageDetailRepository.Validations
{
	public class UpdateUserLanguageDetailValidator : AbstractValidator<UserLanguageDetail>
	{
		private readonly IUserLanguageDetailDal _userLanguageDetailDal;
		private readonly IUserDal _userDal;

		public UpdateUserLanguageDetailValidator(IUserLanguageDetailDal userLanguageDetailDal, IUserDal userDal)
		{
			_userLanguageDetailDal = userLanguageDetailDal;
			_userDal = userDal;

			RuleFor(ul => ul.Id).Must(UserLanguageDetailExists).WithMessage(UserLanguageDetailMessages.UserLanguageDetailNotFound);
			RuleFor(ul => ul.UserId).Must(UserExists).WithMessage(UserMessages.UserNotFound);

		}
		private bool UserExists(long userId)
		{
			return _userDal.Get(u => u.Id == userId) != null;
		}
		private bool UserLanguageDetailExists(long id)
		{
			return _userLanguageDetailDal.Get(u => u.Id == id) != null;
		}
	}
}
