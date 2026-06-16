using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;
using Entities.DTOs.UserDetailDtos;

namespace DataAccess.Repository.UserProfileDetailRepository
{
    public class EfUserProfileDetailDal : EfEntityRepositoryBase<UserProfileDetails, PortalContext>, IUserProfileDetailDal
    {
        public BasicGeneralUserDetailDto GetBasicGeneralUserDetailByUser(long userId)
        {
            using var context = new PortalContext();
            var result = (from userProfileDetail in context.UserProfileDetails
                          where userProfileDetail.UserId == userId
                          join jobDetails in context.UserJobDetails
                          on userId equals jobDetails.UserId into jobDetailsGroup
                          from jobDetail in jobDetailsGroup.DefaultIfEmpty()
                          select new BasicGeneralUserDetailDto
                          {
                              Name = userProfileDetail.Name,
                              Surname = userProfileDetail.Surname,
                              PreferredName = userProfileDetail.PreferredName,
                              BirthDate = userProfileDetail.BirthDate,
                              Sex = userProfileDetail.Sex,
                              Country = userProfileDetail.Country,
                              Province = userProfileDetail.Province,
                              District = userProfileDetail.District,
                              PostCode = userProfileDetail.PostCode,
                              Address = userProfileDetail.Adress,
                              TelNo = userProfileDetail.TelNo,
                              Office = userProfileDetail.Office,
                              Interphone = userProfileDetail.Interphone,
                              JobTitle = jobDetail.JobTitle,
                          }).SingleOrDefault();

            return result;

        }
    }
}
