using Core.Utilities.Results.Abstract;
using Entities.Concrete;

namespace Business.Repository.UserCertificateDetailRepository
{
    public interface IUserCertificateDetailService
    {
        IResult Add(UserCertificateDetail userCertificateDetail);
        IResult Update(UserCertificateDetail userCertificateDetail);
        IResult Delete(long id);
        IDataResult<List<UserCertificateDetail>> GetUserCertificateDetailByUserId(long userId);
    }
}
