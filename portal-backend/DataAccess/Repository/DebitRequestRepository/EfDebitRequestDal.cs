using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context; // Senin Context yolun
using Entities.Concrete;

namespace DataAccess.Repository.DebitRequestRepository
{
    public class EfDebitRequestDal : EfEntityRepositoryBase<DebitRequest, PortalContext>, IDebitRequestDal
    {
    }
}