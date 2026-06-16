using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;

namespace DataAccess.Repository.CustomerRepository
{
    public class EfCustomerDal : EfEntityRepositoryBase<Customer, PortalContext>, ICustomerDal
    {

    }
}
