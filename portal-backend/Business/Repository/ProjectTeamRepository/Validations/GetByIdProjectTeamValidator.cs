using Business.Repository.ProjectTeamRepository.Constants;
using Core.Identity;
using Core.Utilities.Exceptions;
using DataAccess.Repository.ProjectTeamRepository;
using FluentValidation;

namespace Business.Repository.ProjectTeamRepository.Validations
{
	public class GetByIdProjectTeamValidator : AbstractValidator<long>
	{
		private readonly IProjectTeamDal _projectTeamDal;
		private readonly IUserContext _userContext;
		public GetByIdProjectTeamValidator(IProjectTeamDal projectTeamDal, IUserContext userContext)
		{
			_projectTeamDal = projectTeamDal;
			_userContext = userContext;

			RuleFor(projectTeamId => projectTeamId)
				.Cascade(CascadeMode.Stop)
				.Must(ProjectTeamExists).WithMessage(ProjectTeamMessages.ProjectTeamNotFound)
				.Must(UserHasAccessToProjectTeam);
		}

		private bool ProjectTeamExists(long projectTeamId)
		{
			return _projectTeamDal.Get(p => p.Id == projectTeamId) != null;
		}
		private bool UserHasAccessToProjectTeam(long projectTeamId)
		{
			if (_userContext.RoleName != RoleNames.User) return true;
			var access = _projectTeamDal.CanUserAccessProjectTeam(projectTeamId, _userContext.UserId);
			if (access) return true;
			throw new ForbiddenAccessException();
		}
	}
}
