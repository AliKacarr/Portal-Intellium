using Core.Utilities.Results.Abstract;
using Entities.Concrete;

namespace Business.Repository.UserLanguageDetailRepository
{
    public interface IUserLanguageDetailService
    {
        IResult Add(UserLanguageDetail userLanguageDetail);
        IResult Update(UserLanguageDetail userLanguageDetail);
        IResult Delete(long id);
        IDataResult<List<UserLanguageDetail>> GetUserLanguageByUserId(long userId);
    }
}
