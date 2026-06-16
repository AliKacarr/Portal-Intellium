using Business.Repository.UserProfileDetailRepository.Constans;
using DataAccess.Repository.UserProfileDetailRepository;
using FluentValidation;

namespace Business.Repository.UserProfileDetailRepository.Validations
{
	public class DeleteUserProfileDetailValidator : AbstractValidator<long>
	{
		private readonly IUserProfileDetailDal _userProfileDetailDal;
		public DeleteUserProfileDetailValidator(IUserProfileDetailDal userProfileDetailDal)
		{
			_userProfileDetailDal = userProfileDetailDal;

			RuleFor(id => id).Must(UserProfileDetailExists).WithMessage(UserProfileDetailsMessages.UserProfileDetailNotFound);
		}

		private bool UserProfileDetailExists(long id)
		{
			return _userProfileDetailDal.Get(u => u.Id == id) != null;
		}
	}
}
