using Business.BusinessAspects;
using Business.Repository.UserLanguageDetailRepository.Constans;
using Business.Repository.UserLanguageDetailRepository.Validations;
using Core.Aspects.Autofac.Validation;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.UserLanguageDetailRepository;
using Entities.Concrete;
using Microsoft.IdentityModel.Tokens;

namespace Business.Repository.UserLanguageDetailRepository
{
	public class UserLanguageDetailManager : IUserLanguageDetailService
	{
		private readonly IUserLanguageDetailDal _userLanguageDetailDal;

		public UserLanguageDetailManager(IUserLanguageDetailDal userLanguageDetailDal)
		{
			_userLanguageDetailDal = userLanguageDetailDal;
		}

		[LoggerAspect]
		[SecuredOperation(RoleNames.Admin)]
		[ValidationAspect(typeof(AddUserLanguageDetailValidator))]
		public IResult Add(UserLanguageDetail userLanguageDetail)
		{
			_userLanguageDetailDal.Add(userLanguageDetail);
			return new SuccessResult(UserLanguageDetailMessages.AddedUserLanguageDetail);
		}

		[LoggerAspect]
		[SecuredOperation(RoleNames.Admin)]
		[ValidationAspect(typeof(DeleteUserLanguageDetailValidator))]
		public IResult Delete(long id)
		{
			var result = _userLanguageDetailDal.Get(x => x.Id == id);
			_userLanguageDetailDal.Delete(result);
			return new SuccessResult(UserLanguageDetailMessages.DeletedUserLanguageDetail);
		}

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
		public IDataResult<List<UserLanguageDetail>> GetUserLanguageByUserId(long userId)
		{
			var userLanguageDetail = _userLanguageDetailDal.GetById(userId);
			if (userLanguageDetail.IsNullOrEmpty())
			{
				return new ErrorDataResult<List<UserLanguageDetail>>(UserLanguageDetailMessages.UserLanguageDetailNotFound);
			}
			return new SuccessDataResult<List<UserLanguageDetail>>(userLanguageDetail);
		}

		[LoggerAspect]
		[SecuredOperation(RoleNames.Admin)]
		[ValidationAspect(typeof(UpdateUserLanguageDetailValidator))]
		public IResult Update(UserLanguageDetail userLanguageDetail)
		{
			_userLanguageDetailDal.Update(userLanguageDetail);
			return new SuccessResult(UserLanguageDetailMessages.UpdatedUserLanguageDetail);
		}
	}
}
