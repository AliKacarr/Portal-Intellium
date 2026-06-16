using Core.Utilities.Results.Abstract;
using Entities.Concrete;

namespace Business.Repository.UserJobDetailsRepository
{
    public interface IUserJobDetailService
    {
        IResult Add(UserJobDetail userJobDetails);
        IResult Update(UserJobDetail userJobDetails);
        IResult Delete(long id);
        IDataResult<UserJobDetail> GetByUserId(long userId);
        IDataResult<UserJobDetail> GetByUserIdForBusiness(long userId);
    }
}
