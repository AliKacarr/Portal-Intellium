using Business.Repository.ProjectTypeRepository.Constants;
using DataAccess.Repository.ProjectTypeRepository;
using Entities.Concrete;
using FluentValidation;

namespace Business.Repository.ProjectTypeRepository.Validations
{
    public class UpdateProjectTypeValidator : AbstractValidator<ProjectType>
    {
        private readonly IProjectTypeDal _projectTypeDal;
        public UpdateProjectTypeValidator(IProjectTypeDal projectTypeDal)
        {
            _projectTypeDal = projectTypeDal;

            RuleFor(pt => pt.Id).Must(ProjectTypeExists).WithMessage(ProjectTypeMessages.ProjectTypeNotFound);
            RuleFor(pt => pt.ProjectTypeName).MinimumLength(3).WithMessage(ProjectTypeMessages.ProjectTypeNameTooShort);
        }

        private bool ProjectTypeExists(long id)
        {
            return _projectTypeDal.Get(p => p.Id == id) != null;
        }
    }
}
