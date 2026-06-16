using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;

namespace DataAccess.Repository.UserCustomerRepository
{
    public class EfUserCustomerDal : EfEntityRepositoryBase<UserCustomer, PortalContext>, IUserCustomerDal
    {
    }
}
