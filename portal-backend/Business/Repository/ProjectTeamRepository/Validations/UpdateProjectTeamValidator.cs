using Business.Repository.ProjectRepository.Constants;
using Business.Repository.ProjectTeamRepository.Constants;
using Core.Identity;
using Core.Utilities.Exceptions;
using DataAccess.Repository.ProjectRepository;
using DataAccess.Repository.ProjectTeamRepository;
using Entities.Concrete;
using Entities.DTOs.ProjectTeamDtos;
using FluentValidation;

namespace Business.Repository.ProjectTeamRepository.Validations
{
	public class UpdateProjectTeamValidator : AbstractValidator<EditProjectTeamDto>
	{
		private readonly IProjectTeamDal _projectTeamDal;
		private readonly IUserContext _userContext;
		private readonly IProjectDal _projectDal;
		private Project? _cachedProject;
		public UpdateProjectTeamValidator(IProjectTeamDal projectTeamDal, IUserContext userContext, IProjectDal projectDal)
		{
			_projectDal = projectDal;
			_projectTeamDal = projectTeamDal;
			_userContext = userContext;

			RuleFor(pt => pt.Id).Must(ProjectTeamExists).WithMessage(ProjectTeamMessages.ProjectTeamNotFound);

			RuleFor(pt => pt.ProjectId)
				.Cascade(CascadeMode.Stop)
				.Must(ProjectExists).WithMessage(ProjectMessages.ProjectNotFound)
				.Must(UserHasPermission);

			RuleFor(pt => pt.Name).NotEmpty().WithMessage(ProjectTeamMessages.ProjectTeamNameCannotBeEmpty);
			RuleFor(pt => pt.Description).NotEmpty().WithMessage(ProjectTeamMessages.ProjectTeamDescriptionCannotBeEmpty);
		}

		private bool ProjectTeamExists(long id)
		{
			return _projectTeamDal.Get(pt => pt.Id == id) != null;
		}

		private bool ProjectExists(long projectId)
		{
			_cachedProject = _projectDal.Get(p => p.Id == projectId);
			return _cachedProject != null;
		}

		private bool UserHasPermission(long projectId)
		{
			if (_userContext.RoleName == RoleNames.Admin) return true;
			var project = _cachedProject ?? _projectDal.Get(p => p.Id.Equals(projectId));
			if (project.LeaderUserId == _userContext.UserId) return true;
			throw new ForbiddenAccessException();
		}
	}
}
