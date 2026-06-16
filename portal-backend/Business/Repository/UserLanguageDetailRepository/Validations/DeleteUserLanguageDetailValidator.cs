using Business.Repository.UserLanguageDetailRepository.Constans;
using DataAccess.Repository.UserLanguageDetailRepository;
using FluentValidation;

namespace Business.Repository.UserLanguageDetailRepository.Validations
{
	public class DeleteUserLanguageDetailValidator : AbstractValidator<long>
	{
		private readonly IUserLanguageDetailDal _userLanguageDetailDal;
		public DeleteUserLanguageDetailValidator(IUserLanguageDetailDal userLanguageDetailDal)
		{
			_userLanguageDetailDal = userLanguageDetailDal;

			RuleFor(id => id).Must(UserLanguageDetailExists).WithMessage(UserLanguageDetailMessages.UserLanguageDetailNotFound);
		}

		private bool UserLanguageDetailExists(long id)
		{
			return _userLanguageDetailDal.Get(u => u.Id == id) != null;
		}
	}
}
