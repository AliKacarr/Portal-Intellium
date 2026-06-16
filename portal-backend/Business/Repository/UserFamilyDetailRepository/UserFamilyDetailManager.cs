using Business.BusinessAspects;
using Business.Repository.UserFamilyDetailRepository.Constans;
using Business.Repository.UserFamilyDetailRepository.Validations;
using Core.Aspects.Autofac.Validation;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.UserFamilyDetailRepository;
using Entities.Concrete;
using Microsoft.IdentityModel.Tokens;

namespace Business.Repository.UserFamilyDetailRepository
{
    public class UserFamilyDetailManager : IUserFamilyDetailService
    {
        private readonly IUserFamilyDetailDal _userFamilyDetailDal;

        public UserFamilyDetailManager(IUserFamilyDetailDal userFamilyDetailDal)
        {
            _userFamilyDetailDal = userFamilyDetailDal;
        }

		[LoggerAspect]
		[SecuredOperation(RoleNames.Admin)]
        [ValidationAspect(typeof(AddUserFamilyDetailValidator))]
        public IResult Add(UserFamilyDetail userFamilyDetail)
        {
            _userFamilyDetailDal.Add(userFamilyDetail);
            return new SuccessResult(UserFamilyDetailMessages.AddedUserFamilyDetail);
        }

		[LoggerAspect]
		[SecuredOperation(RoleNames.Admin)]
		[ValidationAspect(typeof(DeleteUserFamilyDetailValidator))]
        public IResult Delete(long id)
        {
            var result = _userFamilyDetailDal.Get(x => x.Id == id);
            _userFamilyDetailDal.Delete(result);
            return new SuccessResult(UserFamilyDetailMessages.DeletedUserFamilyDetail);
        }

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.Worker},{RoleNames.Admin}")]
		public IDataResult<List<UserFamilyDetail>> GetUserFamilyDetailsByUserId(long userId)
        {
            var userFamilyDetails = _userFamilyDetailDal.GetUserFamilyDetailByUserId(userId);
            if (userFamilyDetails.IsNullOrEmpty())
            {
                return new ErrorDataResult<List<UserFamilyDetail>>(UserFamilyDetailMessages.UserFamilyDetailNotFound);
            }
            return new SuccessDataResult<List<UserFamilyDetail>>(userFamilyDetails);
        }

		[LoggerAspect]
		[SecuredOperation(RoleNames.Admin)]
		[ValidationAspect(typeof(UpdateUserFamilyDetailValidator))]
        public IResult Update(UserFamilyDetail userFamilyDetail)
        {
            _userFamilyDetailDal.Update(userFamilyDetail);
            return new SuccessResult(UserFamilyDetailMessages.UpdatedUserFamilyDetail);
        }
    }
}
