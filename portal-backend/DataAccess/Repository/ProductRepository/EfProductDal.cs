using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;

namespace DataAccess.Repository.ProductRepository
{
    public class EfProductDal : EfEntityRepositoryBase<Product, PortalContext>, IProductDal
    {
    }
}