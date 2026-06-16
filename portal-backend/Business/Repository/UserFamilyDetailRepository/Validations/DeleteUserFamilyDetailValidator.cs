using Business.Repository.UserFamilyDetailRepository.Constans;
using DataAccess.Repository.UserFamilyDetailRepository;
using FluentValidation;

namespace Business.Repository.UserFamilyDetailRepository.Validations
{
	public class DeleteUserFamilyDetailValidator : AbstractValidator<long>
	{
		private readonly IUserFamilyDetailDal _userFamilyDetailDal;
		public DeleteUserFamilyDetailValidator(IUserFamilyDetailDal userFamilyDetailDal)
		{
			_userFamilyDetailDal = userFamilyDetailDal;

			RuleFor(id => id).Must(UserFamilyDetailExists).WithMessage(UserFamilyDetailMessages.UserFamilyDetailNotFound);
		}

		private bool UserFamilyDetailExists(long id)
		{
			return _userFamilyDetailDal.Get(u => u.Id == id) != null;
		}
	}
}
