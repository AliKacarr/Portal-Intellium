using Core.Utilities.Results.Abstract;
using Entities.Concrete;
using System.Collections.Generic;

namespace Business.Repository.ProductRepository
{
    public interface IProductService
    {
        IResult Add(Product product);
        IResult Update(Product product);
        IResult Delete(Product product);
        IDataResult<Product> GetById(int id);
        IDataResult<List<Product>> GetAll();
        IDataResult<List<Product>> GetAvailableProducts();
    }
}