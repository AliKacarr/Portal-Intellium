using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;

namespace DataAccess.Repository.PollOptionRepository
{
    public class EfPollOptionDal : EfEntityRepositoryBase<PollOption, PortalContext>, IPollOptionDal
    {
    }
}
