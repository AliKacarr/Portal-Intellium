using Business.Repository.CustomerRepository.Constants;
using Business.Repository.ProjectTypeRepository.Constants;
using DataAccess.Repository.CustomerRepository;
using DataAccess.Repository.ProjectTypeRepository;
using DataAccess.Repository.UserRepository;
using Entities.Concrete;
using FluentValidation;

namespace Business.Repository.ProjectRepository.Validations
{
	public class AddProjectValidator : AbstractValidator<Project>
	{
		private readonly IProjectTypeDal _projectTypeDal;
		private readonly IUserDal _userDal;
		private readonly ICustomerDal _customerDal;
		public AddProjectValidator(IProjectTypeDal projectTypeDal, IUserDal userDal, ICustomerDal customerDal)
		{
			_projectTypeDal = projectTypeDal;
			_userDal = userDal;
			_customerDal = customerDal;

			RuleFor(p => p.ProjectName).NotEmpty().WithMessage("Proje adı boş olamaz.");
			RuleFor(p => p.Description).NotEmpty().WithMessage("Proje açıklaması boş olamaz.");

			RuleFor(p => p.ProjectTypeId)
				.Must(ProjectTypeExists)
				.WithMessage(ProjectTypeMessages.ProjectTypeNotFound);

			RuleFor(p => p.LeaderUserId)
				.Must(UserExists)
				.WithMessage("Geçerli bir lider kullanıcı seçmelisiniz.");

			RuleFor(p => p.CustomerId)
				.Must(CustomerExists)
				.WithMessage(CustomerMessages.CustomerNotFound);
		}

		private bool ProjectTypeExists(long projectTypeId)
		{
			return _projectTypeDal.Get(pt => pt.Id == projectTypeId) != null;
		}

		private bool UserExists(long userId)
		{
			return _userDal.Get(u => u.Id == userId) != null;
		}

		private bool CustomerExists(long customerId)
		{
			return _customerDal.Get(c => c.CustomerId == customerId) != null;
		}
	}
}
