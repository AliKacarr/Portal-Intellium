using Business.BusinessAspects;
using Business.Repository.CustomerRepository.Constants;
using Business.Repository.CustomerRepository.Validation;
using Core.Aspects.Autofac.Validation;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.CustomerRepository;
using Entities.Concrete;
using Entities.DTOs.CustomerDtos;

namespace Business.Repository.CustomerRepository
{
    public class CustomerManager : ICustomerService
    {
        private readonly ICustomerDal _customerDal;
        private readonly IUserContext _userContext;

        public CustomerManager(ICustomerDal customerDal, IUserContext userContext)
        {
            _customerDal = customerDal;
            _userContext = userContext;
        }

		[LoggerAspect]
		[SecuredOperation(RoleNames.Admin)]
		[ValidationAspect(typeof(CustomerValidator))]//validation işlemi
        public IResult Add(Customer customer)
        {
            var customerExist = CustomerExists(customer);
            if (!customerExist.Success)
            {
                return new ErrorResult(customerExist.Message);
            }
            customer.AddetAt = DateTime.Now;
            _customerDal.Add(customer);
            return new SuccessResult(CustomerMessages.AddedCustomer);
        }

        public IResult CustomerExists(Customer customer)
        {
            var result = _customerDal.Get(c => c.TaxIdNumber == customer.TaxIdNumber);
            if (result != null)
            {
                return new ErrorResult(CustomerMessages.CustomerAlreadyExist);
            }
            return new SuccessResult(CustomerMessages.AddedCustomer);
        }

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
		public IDataResult<List<BasicCustomerDto>> GetAllAsBasicCustomer()
        {
            List<BasicCustomerDto> customers = _userContext.RoleName.Equals(RoleNames.User) ?
                _customerDal.GetAll(c => c.CustomerId.Equals(_userContext.CustomerId)).Select(customer => new BasicCustomerDto
                {
                    CustomerId = customer.CustomerId,
                    CustomerName = customer.CustomerName,
                }).ToList()
                :
                _customerDal.GetAll().Select(customer => new BasicCustomerDto
                {
                    CustomerId = customer.CustomerId,
                    CustomerName = customer.CustomerName,
                }).ToList();
            return new SuccessDataResult<List<BasicCustomerDto>>(customers);
        }

		[LoggerAspect]
		[SecuredOperation(RoleNames.Admin)]
        public IDataResult<List<Customer>> GetAllAsRaw()
        {
            return new SuccessDataResult<List<Customer>>(_customerDal.GetAll());
        }

		[LoggerAspect]
		[SecuredOperation(RoleNames.Admin)]
        public IResult Update(Customer customer)
        {
            _customerDal.Update(customer);
            return new SuccessResult(CustomerMessages.UpdatedCustomer);
        }

		[LoggerAspect]
		[SecuredOperation(RoleNames.Admin)]
        public IDataResult<Customer> GetCustomer(long id)
        {
            return GetById(id);
        }

        public IDataResult<Customer> GetById(long id)
        {
            var result = _customerDal.Get(p => p.CustomerId == id);
            if (result == null)
            {
                return new ErrorDataResult<Customer>(CustomerMessages.CustomerNotFound);
            }
            return new SuccessDataResult<Customer>(result);
        }
    }
}
