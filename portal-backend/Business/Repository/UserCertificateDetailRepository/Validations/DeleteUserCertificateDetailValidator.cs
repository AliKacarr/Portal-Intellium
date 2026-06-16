using Business.Repository.UserJobDetailsRepository.Constans;
using DataAccess.Repository.UserCertificateDetailRepository;
using FluentValidation;

namespace Business.Repository.UserCertificateDetailRepository.Validations
{
	public class DeleteUserCertificateDetailValidator : AbstractValidator<long>
	{
		private readonly IUserCertificateDetailDal _userCertificateDetailDal;

		public DeleteUserCertificateDetailValidator(IUserCertificateDetailDal userCertificateDetailDal)
		{
			_userCertificateDetailDal = userCertificateDetailDal;

			RuleFor(id => id).Must(UserCertificateDetailExists).WithMessage(UserCertificateDetailMessages.UserCertificateDetailNotFound);
		}

		private bool UserCertificateDetailExists(long id)
		{
			return _userCertificateDetailDal.Get(u => u.Id == id) != null;
		}
	}
}
