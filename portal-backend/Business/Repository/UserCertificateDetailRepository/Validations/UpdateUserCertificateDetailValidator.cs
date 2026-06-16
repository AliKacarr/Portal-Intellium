using Business.Repository.UserJobDetailsRepository.Constans;
using Business.Repository.UserRepository.Constants;
using DataAccess.Repository.UserCertificateDetailRepository;
using DataAccess.Repository.UserRepository;
using Entities.Concrete;
using FluentValidation;

namespace Business.Repository.UserCertificateDetailRepository.Validations
{
	public class UpdateUserCertificateDetailValidator : AbstractValidator<UserCertificateDetail>
	{
		private readonly IUserCertificateDetailDal _userCertificateDetailDal;
		private readonly IUserDal _userDal;

		public UpdateUserCertificateDetailValidator(IUserCertificateDetailDal userCertificateDetailDal, IUserDal userDal)
		{
			_userCertificateDetailDal = userCertificateDetailDal;
			_userDal = userDal;

			RuleFor(p => p.Id).Must(UserCertificateDetailExists).WithMessage(UserCertificateDetailMessages.UserCertificateDetailNotFound);
			RuleFor(p => p.UserId).Must(UserExists).WithMessage(UserMessages.UserNotFound);
		}

		private bool UserExists(long userId)
		{
			return _userDal.Get(u => u.Id == userId) != null;
		}

		private bool UserCertificateDetailExists(long id)
		{
			return _userCertificateDetailDal.Get(u => u.Id == id) != null;
		}
	}
}
