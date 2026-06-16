using Business.Repository.CustomerRepository.Constants;
using Business.Repository.ProjectRepository.Constants;
using Business.Repository.ProjectTypeRepository.Constants;
using Core.Identity;
using Core.Utilities.Exceptions;
using DataAccess.Repository.CustomerRepository;
using DataAccess.Repository.ProjectRepository;
using DataAccess.Repository.ProjectTypeRepository;
using DataAccess.Repository.UserRepository;
using Entities.Concrete;
using FluentValidation;

namespace Business.Repository.ProjectRepository.Validations
{
	public class UpdateProjectValidator : AbstractValidator<Project>
	{
		private readonly IProjectDal _projectDal;
		private readonly IProjectTypeDal _projectTypeDal;
		private readonly IUserDal _userDal;
		private readonly ICustomerDal _customerDal;
		private readonly IUserContext _userContext;
		private Project? _cachedProject;
		public UpdateProjectValidator(IProjectDal projectDal, IProjectTypeDal projectTypeDal, IUserDal userDal, ICustomerDal customerDal, IUserContext userContext)
		{
			_projectDal = projectDal;
			_projectTypeDal = projectTypeDal;
			_userDal = userDal;
			_customerDal = customerDal;
			_userContext = userContext;

			RuleFor(p => p.ProjectName).NotEmpty().WithMessage("Proje adı boş olamaz.");
			RuleFor(p => p.Description).NotEmpty().WithMessage("Proje açıklaması boş olamaz.");

			RuleFor(p => p.Id)
				.Cascade(CascadeMode.Stop)
				.Must(ProjectExists)
				.Must(UserHasPermission)
				.WithMessage(ProjectMessages.ProjectNotFound);

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

		private bool UserHasPermission(long projectId)
		{
			if (_userContext.RoleName == RoleNames.Admin) return true;
			var project = _cachedProject ?? _projectDal.Get(p => p.Id.Equals(projectId));
			if (project.LeaderUserId == _userContext.UserId) return true;
			throw new ForbiddenAccessException();
		}
		private bool ProjectExists(long projectId)
		{
			_cachedProject = _projectDal.Get(p => p.Id == projectId);
			return _cachedProject != null;
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
