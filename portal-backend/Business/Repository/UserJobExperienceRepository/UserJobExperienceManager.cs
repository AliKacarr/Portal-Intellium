using Business.BusinessAspects;
using Business.Repository.UserJobExperienceRepository.Constans;
using Business.Repository.UserJobExperienceRepository.Validations;
using Core.Aspects.Autofac.Validation;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.UserJobExperienceRepository;
using Entities.Concrete;
using Microsoft.IdentityModel.Tokens;

namespace Business.Repository.UserJobExperienceRepository
{
	public class UserJobExperienceManager : IUserJobExperienceService
	{
		private readonly IUserJobExperienceDal _userJobExperienceDal;
		public UserJobExperienceManager(IUserJobExperienceDal userJobExperienceDal)
		{
			_userJobExperienceDal = userJobExperienceDal;
		}

		[LoggerAspect]
		[SecuredOperation(RoleNames.Admin)]
		[ValidationAspect(typeof(AddUserJobExperienceValidator))]
		public IResult Add(UserJobExperience userJobExperience)
		{
			_userJobExperienceDal.Add(userJobExperience);
			return new SuccessResult(UserJobExperienceMessages.AddedUserJobExperience);
		}

		[LoggerAspect]
		[SecuredOperation(RoleNames.Admin)]
		[ValidationAspect(typeof(DeleteUserJobExperienceValidator))]
		public IResult Delete(long id)
		{
			var result = _userJobExperienceDal.Get(u => u.Id.Equals(id));
			_userJobExperienceDal.Delete(result);
			return new SuccessResult(UserJobExperienceMessages.DeletedUserJobExperience);

		}

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.Worker},{RoleNames.Admin}")]
		public IDataResult<List<UserJobExperience>> GetAllByUserId(long userId)
		{
			var result = _userJobExperienceDal.GetAll(u => u.UserId.Equals(userId));
			if (result.IsNullOrEmpty())
			{
				return new ErrorDataResult<List<UserJobExperience>>(UserJobExperienceMessages.UserHasNoExperience);
			}
			return new SuccessDataResult<List<UserJobExperience>>(result, UserJobExperienceMessages.ListedUserJobExperiences);
		}

		[LoggerAspect]
		[SecuredOperation(RoleNames.Admin)]
		[ValidationAspect(typeof(UpdateUserJobExperienceValidator))]
		public IResult Update(UserJobExperience userJobExperience)
		{
			_userJobExperienceDal.Update(userJobExperience);
			return new SuccessResult(UserJobExperienceMessages.UpdatedUserJobExperience);
		}
	}
}
