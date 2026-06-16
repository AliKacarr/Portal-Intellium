using Business.Repository.ProjectTypeRepository.Constants;
using Entities.Concrete;
using FluentValidation;

namespace Business.Repository.ProjectTypeRepository.Validations
{
    public class AddProjectTypeValidator : AbstractValidator<ProjectType>
    {
        public AddProjectTypeValidator()
        {
            RuleFor(pt => pt.ProjectTypeName).MinimumLength(3).WithMessage(ProjectTypeMessages.ProjectTypeNameTooShort);
        }
    }
}
