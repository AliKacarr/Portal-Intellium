using Business.Repository.UserJobExperienceRepository.Constans;
using DataAccess.Repository.UserJobExperienceRepository;
using FluentValidation;

namespace Business.Repository.UserJobExperienceRepository.Validations
{
	public class DeleteUserJobExperienceValidator : AbstractValidator<long>
	{
		private readonly IUserJobExperienceDal _userJobExperienceDal;
		public DeleteUserJobExperienceValidator(IUserJobExperienceDal userJobExperienceDal)
		{
			_userJobExperienceDal = userJobExperienceDal;

			RuleFor(id => id).Must(UserJobExperienceExists).WithMessage(UserJobExperienceMessages.UserJobExperienceNotFound);
		}

		private bool UserJobExperienceExists(long id)
		{
			return _userJobExperienceDal.Get(u => u.Id == id) != null;
		}
	}
}
