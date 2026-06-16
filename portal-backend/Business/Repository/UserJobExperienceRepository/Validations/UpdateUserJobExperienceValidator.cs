using Business.Repository.UserJobExperienceRepository.Constans;
using Business.Repository.UserRepository.Constants;
using DataAccess.Repository.UserJobExperienceRepository;
using DataAccess.Repository.UserRepository;
using Entities.Concrete;
using FluentValidation;

namespace Business.Repository.UserJobExperienceRepository.Validations
{
	public class UpdateUserJobExperienceValidator : AbstractValidator<UserJobExperience>
	{
		private readonly IUserDal _userDal;
		private readonly IUserJobExperienceDal _userJobExperienceDal;

		public UpdateUserJobExperienceValidator(IUserDal userDal, IUserJobExperienceDal userJobExperienceDal)
		{
			_userDal = userDal;
			_userJobExperienceDal = userJobExperienceDal;

			RuleFor(p => p.Id).Must(UserJobExperienceExists).WithMessage(UserJobExperienceMessages.UserJobExperienceNotFound);
			RuleFor(p => p.UserId).Must(UserExists).WithMessage(UserMessages.UserNotFound);
		}

		private bool UserExists(long userId)
		{
			return _userDal.Get(u => u.Id == userId) != null;
		}

		private bool UserJobExperienceExists(long id)
		{
			return _userJobExperienceDal.Get(u => u.Id == id) != null;
		}
	}
}
