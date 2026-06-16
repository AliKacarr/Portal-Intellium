using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;

namespace DataAccess.Repository.RequestRepository
{
    public class EfRequestStatusHistoryDal : EfEntityRepositoryBase<RequestStatusHistory, PortalContext>, IRequestStatusHistoryDal
    {
    }
}

