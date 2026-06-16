using Core.Utilities.Results.Abstract;
using Entities.Concrete;

namespace Business.Repository.UserFamilyDetailRepository
{
    public interface IUserFamilyDetailService
    {
        IResult Add(UserFamilyDetail userFamilyDetail);
        IResult Update(UserFamilyDetail userFamilyDetail);
        IResult Delete(long id);
        IDataResult<List<UserFamilyDetail>> GetUserFamilyDetailsByUserId(long userId);
    }
}
