using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;

namespace DataAccess.Repository.UserAgreementRepository
{
    public class EfUserAgreementDal : EfEntityRepositoryBase<UserAgreement, PortalContext>, IUserAgreementDal
    {
    }
}
