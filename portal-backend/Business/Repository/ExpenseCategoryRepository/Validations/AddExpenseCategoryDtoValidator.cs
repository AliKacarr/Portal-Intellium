using Entities.DTOs.ExpenseCategoryDto;
using FluentValidation;

namespace Business.Repository.ExpenseCategoryRepository.Validations
{
    public class AddExpenseCategoryDtoValidator : AbstractValidator<AddExpenseCategoryDto>
    {
        public AddExpenseCategoryDtoValidator()
        {
            RuleFor(x => x.Value).NotEmpty().WithMessage("Kategori adı boş olamaz.")
                .MaximumLength(100).WithMessage("Kategori adı en fazla 100 karakter olabilir.");
        }
    }
}
