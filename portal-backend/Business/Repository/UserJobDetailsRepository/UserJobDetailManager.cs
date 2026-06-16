using Business.BusinessAspects;
using Business.Helpers;
using Business.Repository.UserJobDetailsRepository.Constans;
using Business.Repository.UserJobDetailsRepository.Validations;
using Core.Aspects.Autofac.Validation;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.UserJobDetailRepository;
using DataAccess.Repository.UserPermissionRepository;
using DataAccess.Repository.UserProfileDetailRepository;
using Entities.Concrete;

namespace Business.Repository.UserJobDetailsRepository
{
    public class UserJobDetailManager : IUserJobDetailService
    {
        private readonly IUserJobDetailDal _userJobDetailDal;
        private readonly IUserPermissionDal _userPermissionDal;
        private readonly IUserProfileDetailDal _userProfileDetailDal;

        public UserJobDetailManager(
            IUserJobDetailDal userJobDetailDal,
            IUserPermissionDal userPermissionDal,
            IUserProfileDetailDal userProfileDetailDal)
        {
            _userJobDetailDal = userJobDetailDal;
            _userPermissionDal = userPermissionDal;
            _userProfileDetailDal = userProfileDetailDal;
        }

        [LoggerAspect]
        [SecuredOperation(RoleNames.Admin)]
        [ValidationAspect(typeof(AddUserJobDetailValidator))]
        public IResult Add(UserJobDetail userJobDetails)
        {
            _userJobDetailDal.Add(userJobDetails);
            RecalculateLeaveIfPossible(userJobDetails);
            return new SuccessResult(UserJobDetailsMessages.AddedUserJobDetail);
        }

        [LoggerAspect]
        [SecuredOperation(RoleNames.Admin)]
        [ValidationAspect(typeof(DeleteUserJobDetailValidator))]
        public IResult Delete(long id)
        {
            var result = _userJobDetailDal.Get(x => x.Id == id);
            _userJobDetailDal.Delete(result);
            return new SuccessResult(UserJobDetailsMessages.DeletedUserJobDetail);
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.Worker},{RoleNames.Admin}")]
        public IDataResult<UserJobDetail> GetByUserId(long userId)
        {
            var userJobDetail = _userJobDetailDal.Get(u => u.UserId.Equals(userId));
            return userJobDetail != null
                ? new SuccessDataResult<UserJobDetail>(userJobDetail)
                : new ErrorDataResult<UserJobDetail>(UserJobDetailsMessages.UserJobDetailNotFound);
        }

        public IDataResult<UserJobDetail> GetByUserIdForBusiness(long userId)
        {
            var userJobDetail = _userJobDetailDal.Get(u => u.UserId.Equals(userId));
            return userJobDetail != null
                ? new SuccessDataResult<UserJobDetail>(userJobDetail)
                : new ErrorDataResult<UserJobDetail>();
        }

        [LoggerAspect]
        [SecuredOperation(RoleNames.Admin)]
        [ValidationAspect(typeof(UpdateUserJobDetailValidator))]
        public IResult Update(UserJobDetail userJobDetails)
        {
            _userJobDetailDal.Update(userJobDetails);
            RecalculateLeaveIfPossible(userJobDetails);
            return new SuccessResult(UserJobDetailsMessages.UpdatedUserJobDetail);
        }

        private void RecalculateLeaveIfPossible(UserJobDetail userJobDetails)
        {
            if (userJobDetails.StartDate.HasValue)
            {
                DateTime startDate = userJobDetails.StartDate.Value;

                // Doğum tarihini UserProfileDetail'dan çek
                var profile = _userProfileDetailDal.Get(p => p.UserId == userJobDetails.UserId);
                DateTime birthDate = profile?.BirthDate ?? default;

                int newThisYearLeave = UserPermissionCalculate.CalculateThisYearLeave(startDate, birthDate);
                int newTotalLeave = UserPermissionCalculate.CalculateTotalLeave(startDate, birthDate);

                var existingPermission = _userPermissionDal.GetUserPermissionByUserId(userJobDetails.UserId);

                if (existingPermission != null)
                {
                    // İşe giriş tarihi güncellendiğinde toplam aynı kalsa bile kalan izin sıfırdan hesaplanmalı.
                    existingPermission.ThisYear = newThisYearLeave;
                    existingPermission.TotalLeave = newTotalLeave;
                    existingPermission.RemainingLeave = existingPermission.TotalLeave - existingPermission.UsedLeave;
                    existingPermission.Year = DateTime.Now.Year;
                    _userPermissionDal.Update(existingPermission);
                }
                else
                {
                    // Kayıt yoksa yeni oluştur
                    _userPermissionDal.Add(new UserPermission
                    {
                        UserId = userJobDetails.UserId,
                        TotalLeave = newTotalLeave,
                        RemainingLeave = newTotalLeave,
                        UsedLeave = 0,
                        ThisYear = newThisYearLeave,
                        Year = DateTime.Now.Year
                    });
                }
            }
        }
    }
}
