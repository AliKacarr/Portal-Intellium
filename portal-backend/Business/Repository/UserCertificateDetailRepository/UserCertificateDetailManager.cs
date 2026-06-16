using Business.BusinessAspects;
using Business.Repository.UserCertificateDetailRepository.Validations;
using Business.Repository.UserJobDetailsRepository.Constans;
using Core.Aspects.Autofac.Validation;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.UserCertificateDetailRepository;
using Entities.Concrete;
using Microsoft.IdentityModel.Tokens;

namespace Business.Repository.UserCertificateDetailRepository
{
	public class UserCertificateDetailManager : IUserCertificateDetailService
	{
		private readonly IUserCertificateDetailDal _userCertificateDetailDal;

		public UserCertificateDetailManager(IUserCertificateDetailDal userCertificateDetailDal)
		{
			_userCertificateDetailDal = userCertificateDetailDal;
		}

		[LoggerAspect]
		[SecuredOperation(RoleNames.Admin)]
		[ValidationAspect(typeof(AddUserCertificateDetailValidator))]
		public IResult Add(UserCertificateDetail userCertificateDetail)
		{
			_userCertificateDetailDal.Add(userCertificateDetail);
			return new SuccessResult(UserCertificateDetailMessages.AddedUserCertificateDetail);
		}

		[LoggerAspect]
		[SecuredOperation(RoleNames.Admin)]
		[ValidationAspect(typeof(DeleteUserCertificateDetailValidator))]
		public IResult Delete(long id)
		{
			var result = _userCertificateDetailDal.Get(x => x.Id == id);
			_userCertificateDetailDal.Delete(result);
			return new SuccessResult(UserCertificateDetailMessages.DeletedUserCertificateDetail);

		}

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.Worker},{RoleNames.Admin}")]
		public IDataResult<List<UserCertificateDetail>> GetUserCertificateDetailByUserId(long userId)
		{
			var userCertificateDetail = _userCertificateDetailDal.GetUserCertificateDetailByUserId(userId);
			if (userCertificateDetail.IsNullOrEmpty())
			{
				return new ErrorDataResult<List<UserCertificateDetail>>(UserCertificateDetailMessages.UserCertificateDetailNotFound);
			}
			return new SuccessDataResult<List<UserCertificateDetail>>(userCertificateDetail);
		}

		[LoggerAspect]
		[SecuredOperation(RoleNames.Admin)]
		[ValidationAspect(typeof(UpdateUserCertificateDetailValidator))]
		public IResult Update(UserCertificateDetail userCertificateDetail)
		{
			_userCertificateDetailDal.Update(userCertificateDetail);
			return new SuccessResult(UserCertificateDetailMessages.UpdatedUserCertificateDetail);
		}
	}
}
