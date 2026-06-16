using Core.DataAccess;
using Entities.Concrete;

namespace DataAccess.Repository.CustomerRepository
{
    public interface ICustomerDal : IEntityRepository<Customer>
    {
    }
}
