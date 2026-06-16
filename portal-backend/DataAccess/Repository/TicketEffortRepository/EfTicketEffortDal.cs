using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;

namespace DataAccess.Repository.TicketEffortRepository
{
    public class EfTicketEffortDal : EfEntityRepositoryBase<TicketEffort, PortalContext>, ITicketEffortDal
    {
    }
}
