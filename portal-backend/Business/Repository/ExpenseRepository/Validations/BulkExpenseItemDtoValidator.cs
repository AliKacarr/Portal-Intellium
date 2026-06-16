using Core.Constants;
using Entities.DTOs.ExpenseDto;
using FluentValidation;

namespace Business.Repository.ExpenseRepository.Validations
{
    public class BulkExpenseItemDtoValidator : AbstractValidator<BulkExpenseItemDto>
    {
        public BulkExpenseItemDtoValidator()
        {
            RuleFor(x => x.UserId).GreaterThan(0);
            RuleFor(x => x.InvoiceNumber).NotEmpty();
            RuleFor(x => x.InvoiceDate).NotEmpty();
            RuleFor(x => x.ProjectName).NotEmpty();
            RuleFor(x => x.InvoiceTitle).NotEmpty();
            RuleFor(x => x.Description).NotEmpty().MaximumLength(200);
            RuleFor(x => x.ExcludingVatAmount).GreaterThanOrEqualTo(0);
            RuleFor(x => x.VatRate).InclusiveBetween(0, 100);
            RuleFor(x => x.CurrencyCode).Must(ExpenseCurrencyCodes.IsAllowed).WithMessage("Geçersiz para birimi.");
            When(x => x.InvoiceTitle == "Yemek" || x.InvoiceTitle == "Ulaşım", () =>
            {
                RuleFor(x => x.PersonCount).GreaterThan(0).WithMessage("Kişi sayısı girmelisiniz.");
            });
            When(x => x.InvoiceTitle == "Yemek", () =>
            {
                RuleFor(x => x.MealPersonNames).NotEmpty().WithMessage("Katılımcı isimlerini girmelisiniz.");
            });
        }
    }
}
