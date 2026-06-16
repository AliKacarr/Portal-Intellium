using Business.Repository.ProjectTeamRepository.Constants;
using Core.Identity;
using Core.Utilities.Exceptions;
using DataAccess.Repository.ProjectRepository;
using DataAccess.Repository.ProjectTeamRepository;
using Entities.Concrete;
using FluentValidation;

namespace Business.Repository.ProjectTeamRepository.Validations
{
	public class DeleteProjectTeamValidator : AbstractValidator<long>
	{
		private readonly IProjectTeamDal _projectTeamDal;
		private readonly IProjectDal _projectDal;
		private readonly IUserContext _userContext;
		private ProjectTeam? _cachedProjectTeam;
		public DeleteProjectTeamValidator(IProjectTeamDal projectTeamDal, IProjectDal projectDal, IUserContext userContext)
		{
			_projectTeamDal = projectTeamDal;
			_projectDal = projectDal;
			_userContext = userContext;

			RuleFor(pt => pt)
				.Cascade(CascadeMode.Stop)
				.Must(ProjectTeamExists).WithMessage(ProjectTeamMessages.ProjectTeamNotFound)
				.Must(UserHasPermission);
		}

		private bool ProjectTeamExists(long id)
		{
			_cachedProjectTeam = _projectTeamDal.Get(pt => pt.Id == id);
			return _cachedProjectTeam != null;
		}

		private bool UserHasPermission(long projectTeamId)
		{
			if (_userContext.RoleName == RoleNames.Admin) return true;
			var projectTeam = _cachedProjectTeam ?? _projectTeamDal.Get(pt => pt.Id == projectTeamId);
			var project = _projectDal.Get(p => p.Id.Equals(projectTeam.ProjectId));
			if (project.LeaderUserId == _userContext.UserId) return true;
			throw new ForbiddenAccessException();
		}
	}
}
