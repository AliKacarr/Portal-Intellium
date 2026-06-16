using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.UserCustomerRepository;
using Entities.Concrete;

namespace Business.Repository.UserCustomerRepository
{
    public class UserCustomerManager : IUserCustomerService
    {
        private readonly IUserCustomerDal _userCustomerDal;
        public UserCustomerManager(IUserCustomerDal userCustomerDal)
        {
            _userCustomerDal = userCustomerDal;
        }
        public IResult Add(UserCustomer userCustomer)
        {
            var isExists = _userCustomerDal.Get(uc => uc.UserId.Equals(userCustomer.UserId) && uc.CustomerId.Equals(userCustomer.CustomerId));
            if (isExists != null)
            {
                return new ErrorResult("Kullanıcı zaten bir şirkete bağlı.");
            }

            userCustomer.AddetAt = DateTime.Now;
            userCustomer.IsActive = true;

            _userCustomerDal.Add(userCustomer);
            return new SuccessResult();
        }

        public IDataResult<UserCustomer> GetByUserId(long userId)
        {
            var result = _userCustomerDal.Get(uc => uc.UserId.Equals(userId));
            return new SuccessDataResult<UserCustomer>(result);
        }

        public IResult Update(UserCustomer userCustomer)
        {
            _userCustomerDal.Update(userCustomer);
            return new SuccessResult();
        }
    }
}
