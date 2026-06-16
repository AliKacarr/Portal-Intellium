using Business.Repository.ProjectRepository.Constants;
using Core.Identity;
using Core.Utilities.Exceptions;
using DataAccess.Repository.ProjectRepository;
using FluentValidation;

namespace Business.Repository.ProjectRepository.Validations
{
    public class GetByIdProjectValidator : AbstractValidator<long>
    {
        private readonly IProjectDal _projectDal;
        private readonly IUserContext _userContext;
        public GetByIdProjectValidator(IProjectDal projectDal, IUserContext userContext)
        {
            _projectDal = projectDal;
            _userContext = userContext;

            RuleFor(projectId => projectId)
                .Cascade(CascadeMode.Stop)
                .Must(ProjectExists).WithMessage(ProjectMessages.ProjectNotFound)
                .Must(UserHasAccessToProject);

        }
        private bool ProjectExists(long projectId)
        {
            return _projectDal.Get(p => p.Id == projectId) != null;
        }
        private bool UserHasAccessToProject(long projectId)
        {
            if (_userContext.RoleName != RoleNames.User) return true;
            var access = _projectDal.CanUserAccessProject(projectId, _userContext.CustomerId, _userContext.UserId);
            if (access) return true;
            throw new ForbiddenAccessException();
        }
    }
}
