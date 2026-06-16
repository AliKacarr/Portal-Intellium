using Business.Repository.UserJobDetailsRepository.Constans;
using DataAccess.Repository.UserEducationDetailRepository;
using FluentValidation;

namespace Business.Repository.UserEducationDetailRepository.Validations
{
	public class DeleteUserEducationDetailValidator : AbstractValidator<long>
	{
		private readonly IUserEducationDetailDal _userEducationDetailDal;

		public DeleteUserEducationDetailValidator(IUserEducationDetailDal userEducationDetailDal)
		{
			_userEducationDetailDal = userEducationDetailDal;

			RuleFor(id => id).Must(UserEducationDetailExists).WithMessage(UserEducationDetailMessages.UserEducationDetailNotFound);
		}

		private bool UserEducationDetailExists(long id)
		{
			return _userEducationDetailDal.Get(u => u.Id == id) != null;
		}
	}
}
