using Core.Utilities.Results.Abstract;
using Entities.Concrete;

namespace Business.Repository.UserCustomerRepository
{
    public interface IUserCustomerService
    {
        IResult Add(UserCustomer userCustomer);
        IResult Update(UserCustomer userCustomer);
        IDataResult<UserCustomer> GetByUserId(long userId);
    }
}
