using Entities.DTOs.DepartmentDtos;
using FluentValidation;

namespace Business.Repository.DepartmentRepository.Validations
{
    public class UpdateDepartmentDtoValidator : AbstractValidator<UpdateDepartmentDto>
    {
        public UpdateDepartmentDtoValidator()
        {
            RuleFor(x => x.Id).GreaterThan(0).WithMessage("Geçerli bir departman ID giriniz.");
            RuleFor(x => x.Name).NotEmpty().WithMessage("Departman adı zorunludur.").MaximumLength(100);
        }
    }
}
