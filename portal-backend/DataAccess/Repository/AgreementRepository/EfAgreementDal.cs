using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;

namespace DataAccess.Repository.AgreementRepository
{
    public class EfAgreementDal : EfEntityRepositoryBase<Agreement, PortalContext>, IAgreementDal
    {
    }
}
