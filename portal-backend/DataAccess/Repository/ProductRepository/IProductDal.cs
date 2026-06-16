using Core.DataAccess;
using Entities.Concrete;

namespace DataAccess.Repository.ProductRepository
{
    public interface IProductDal : IEntityRepository<Product>
    {
        // İleride özel raporlar gerekirse buraya yazarız
    }
}