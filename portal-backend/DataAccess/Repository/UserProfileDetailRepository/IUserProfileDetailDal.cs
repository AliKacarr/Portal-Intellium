using Core.DataAccess;
using Entities.Concrete;
using Entities.DTOs.UserDetailDtos;

namespace DataAccess.Repository.UserProfileDetailRepository
{
    public interface IUserProfileDetailDal : IEntityRepository<UserProfileDetails>
    {
        BasicGeneralUserDetailDto GetBasicGeneralUserDetailByUser(long userId);
    }
}
