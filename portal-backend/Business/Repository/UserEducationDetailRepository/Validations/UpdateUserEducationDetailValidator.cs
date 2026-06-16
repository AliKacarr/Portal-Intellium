using Business.Repository.UserJobDetailsRepository.Constans;
using Business.Repository.UserRepository.Constants;
using DataAccess.Repository.UserEducationDetailRepository;
using DataAccess.Repository.UserRepository;
using Entities.Concrete;
using FluentValidation;

namespace Business.Repository.UserEducationDetailRepository.Validations
{
	public class UpdateUserEducationDetailValidator : AbstractValidator<UserEducationDetail>
	{
		private readonly IUserEducationDetailDal _userEducationDetailDal;
		private readonly IUserDal _userDal;

		public UpdateUserEducationDetailValidator(IUserDal userDal, IUserEducationDetailDal userEducationDetailDal)
		{
			_userEducationDetailDal = userEducationDetailDal;
			_userDal = userDal;

			RuleFor(p => p.Id).Must(UserEducationDetailExists).WithMessage(UserEducationDetailMessages.UserEducationDetailNotFound);
			RuleFor(p => p.UserId).Must(UserExists).WithMessage(UserMessages.UserNotFound);
		}


		private bool UserExists(long userId)
		{
			return _userDal.Get(u => u.Id == userId) != null;
		}

		private bool UserEducationDetailExists(long id)
		{
			return _userEducationDetailDal.Get(u => u.Id == id) != null;
		}
	}
}
