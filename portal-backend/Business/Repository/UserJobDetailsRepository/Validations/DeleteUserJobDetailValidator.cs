using Business.Repository.UserJobDetailsRepository.Constans;
using DataAccess.Repository.UserJobDetailRepository;
using FluentValidation;

namespace Business.Repository.UserJobDetailsRepository.Validations
{
	public class DeleteUserJobDetailValidator : AbstractValidator<long>
	{
		private readonly IUserJobDetailDal _userJobDetailDal;
		public DeleteUserJobDetailValidator(IUserJobDetailDal userJobDetailDal)
		{
			_userJobDetailDal = userJobDetailDal;

			RuleFor(id => id).Must(UserJobDetailExists).WithMessage(UserJobDetailsMessages.UserJobDetailNotFound);
		}

		private bool UserJobDetailExists(long id)
		{
			return _userJobDetailDal.Get(u => u.Id == id) != null;
		}
	}
}
