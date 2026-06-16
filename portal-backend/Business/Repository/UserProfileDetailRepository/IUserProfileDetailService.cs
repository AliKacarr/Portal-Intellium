using Core.Utilities.Results.Abstract;
using Entities.Concrete;
using Entities.DTOs.UserDetailDtos;

namespace Business.Repository.UserProfileDetailRepository
{
    public interface IUserProfileDetailService
    {
        IResult Add(UserProfileDetails userProfileDetails);
        IResult Update(UserProfileDetails userProfileDetails);
        IResult Delete(long id);
        IDataResult<UserProfileDetails> GetUserProfileDetailsByUserId(long userId);
        IDataResult<BasicGeneralUserDetailDto> GetBasicGeneralUserDetailByUser();
    }
}
