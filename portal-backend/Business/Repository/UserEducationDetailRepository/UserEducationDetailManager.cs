using Business.BusinessAspects;
using Business.Repository.UserEducationDetailRepository.Validations;
using Business.Repository.UserJobDetailsRepository.Constans;
using Core.Aspects.Autofac.Validation;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.UserEducationDetailRepository;
using Entities.Concrete;
using Microsoft.IdentityModel.Tokens;

namespace Business.Repository.UserEducationDetailRepository
{
	public class UserEducationDetailManager : IUserEducationDetailService
	{
		private readonly IUserEducationDetailDal _userEducationDetailDal;

		public UserEducationDetailManager(IUserEducationDetailDal userEducationDetailDal)
		{
			_userEducationDetailDal = userEducationDetailDal;
		}

		[LoggerAspect]
		[SecuredOperation(RoleNames.Admin)]
		[ValidationAspect(typeof(AddUserEducationDetailValidator))]
		public IResult Add(UserEducationDetail userEducationDetails)
		{
			_userEducationDetailDal.Add(userEducationDetails);
			return new SuccessResult(UserEducationDetailMessages.AddedUserEducationDetail);
		}


		[LoggerAspect]
		[SecuredOperation(RoleNames.Admin)]
		[ValidationAspect(typeof(DeleteUserEducationDetailValidator))]
		public IResult Delete(long id)
		{
			var result = _userEducationDetailDal.Get(x => x.Id == id);
			_userEducationDetailDal.Delete(result);
			return new SuccessResult(UserEducationDetailMessages.DeletedUserEducationDetail);
		}

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.Worker},{RoleNames.Admin}")]
		public IDataResult<List<UserEducationDetail>> GetUserEducationDetailsByUserId(long userId)
		{
			var userEducationDetails = _userEducationDetailDal.GetUserEducationDetailByUserId(userId);
			if (userEducationDetails.IsNullOrEmpty())
			{
				return new ErrorDataResult<List<UserEducationDetail>>(UserEducationDetailMessages.UserEducationDetailNotFound);
			}
			return new SuccessDataResult<List<UserEducationDetail>>(userEducationDetails);
		}

		[LoggerAspect]
		[SecuredOperation(RoleNames.Admin)]
		[ValidationAspect(typeof(UpdateUserEducationDetailValidator))]
		public IResult Update(UserEducationDetail userEducationDetails)
		{
			_userEducationDetailDal.Update(userEducationDetails);
			return new SuccessResult(UserEducationDetailMessages.UpdatedUserEducationDetail);
		}
	}
}
