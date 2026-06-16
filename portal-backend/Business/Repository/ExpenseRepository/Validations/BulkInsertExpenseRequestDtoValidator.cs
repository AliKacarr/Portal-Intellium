using Entities.DTOs.ExpenseDto;
using FluentValidation;

namespace Business.Repository.ExpenseRepository.Validations
{
    public class BulkInsertExpenseRequestDtoValidator : AbstractValidator<BulkInsertExpenseRequestDto>
    {
        public BulkInsertExpenseRequestDtoValidator()
        {
            RuleFor(x => x.Expenses).NotEmpty().WithMessage("En az bir masraf gönderilmelidir.");
            RuleFor(x => x.Expenses).Must(list => list != null && list.Count <= 200).WithMessage("Bir seferde en fazla 200 masraf eklenebilir.");
            RuleForEach(x => x.Expenses).SetValidator(new BulkExpenseItemDtoValidator());
        }
    }
}
