using Business.Repository.ProjectTypeRepository.Constants;
using DataAccess.Repository.ProjectTypeRepository;
using FluentValidation;

namespace Business.Repository.ProjectTypeRepository.Validations
{
    public class DeleteProjectTypeValidator : AbstractValidator<long>
    {
        private readonly IProjectTypeDal _projectTypeDal;
        public DeleteProjectTypeValidator(IProjectTypeDal projectTypeDal)
        {
            _projectTypeDal = projectTypeDal;

            RuleFor(id => id).Must(ProjectTypeExists).WithMessage(ProjectTypeMessages.ProjectTypeNotFound);
        }

        private bool ProjectTypeExists(long id)
        {
            return _projectTypeDal.Get(p => p.Id == id) != null;
        }
    }
}
