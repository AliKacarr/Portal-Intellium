using Core.Utilities.Results.Abstract;
using Entities.Concrete;
using Entities.DTOs.CustomerDtos;

namespace Business.Repository.CustomerRepository
{
    public interface ICustomerService
    {
        IResult Add(Customer customer);
        IResult Update(Customer customer);
        IDataResult<List<Customer>> GetAllAsRaw();
        IDataResult<List<BasicCustomerDto>> GetAllAsBasicCustomer();
        IDataResult<Customer> GetById(long id);
        IDataResult<Customer> GetCustomer(long id);
        IResult CustomerExists(Customer customer);
    }
}
