using Business.Repository.UserFamilyDetailRepository.Constans;
using Business.Repository.UserRepository.Constants;
using DataAccess.Repository.UserFamilyDetailRepository;
using DataAccess.Repository.UserRepository;
using Entities.Concrete;
using FluentValidation;

namespace Business.Repository.UserFamilyDetailRepository.Validations
{
	public class UpdateUserFamilyDetailValidator : AbstractValidator<UserFamilyDetail>
	{
		private readonly IUserFamilyDetailDal _userFamilyDetailDal;
		private readonly IUserDal _userDal;

		public UpdateUserFamilyDetailValidator(IUserFamilyDetailDal userFamilyDetailDal, IUserDal userDal)
		{
			_userFamilyDetailDal = userFamilyDetailDal;
			_userDal = userDal;

			RuleFor(u => u.Id).Must(UserFamilyDetailExists).WithMessage(UserFamilyDetailMessages.UserFamilyDetailNotFound);
			RuleFor(p => p.UserId).Must(UserExists).WithMessage(UserMessages.UserNotFound);
		}

		private bool UserFamilyDetailExists(long id)
		{
			return _userFamilyDetailDal.Get(u => u.Id == id) != null;
		}

		private bool UserExists(long userId)
		{
			return _userDal.Get(u => u.Id == userId) != null;
		}
	}
}
