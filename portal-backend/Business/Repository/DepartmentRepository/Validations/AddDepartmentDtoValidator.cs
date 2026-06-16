using Entities.DTOs.DepartmentDtos;
using FluentValidation;

namespace Business.Repository.DepartmentRepository.Validations
{
    public class AddDepartmentDtoValidator : AbstractValidator<AddDepartmentDto>
    {
        public AddDepartmentDtoValidator()
        {
            RuleFor(x => x.Name).NotEmpty().WithMessage("Departman adı zorunludur.").MaximumLength(100);
        }
    }
}
