using Core.Utilities.Results.Abstract;
using Entities.Concrete;

namespace Business.Repository.UserEducationDetailRepository
{
    public interface IUserEducationDetailService
    {
        IResult Add(UserEducationDetail userEducationDetails);
        IResult Update(UserEducationDetail userEducationDetails);
        IResult Delete(long id);
        IDataResult<List<UserEducationDetail>> GetUserEducationDetailsByUserId(long userId);
    }
}
