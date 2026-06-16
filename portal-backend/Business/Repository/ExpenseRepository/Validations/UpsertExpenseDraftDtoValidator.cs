using Core.Constants;
using Entities.DTOs.ExpenseDto;
using FluentValidation;

namespace Business.Repository.ExpenseRepository.Validations
{
    /// <summary>Taslak validasyonu: zorunlu alanları dayatmaz, sadece gelen alanları sınırlar.</summary>
    public class UpsertExpenseDraftDtoValidator : AbstractValidator<UpsertExpenseDraftDto>
    {
        public UpsertExpenseDraftDtoValidator()
        {
            When(x => x.UserId.HasValue, () => RuleFor(x => x.UserId!.Value).GreaterThan(0));

            When(x => x.InvoiceNumber != null, () => RuleFor(x => x.InvoiceNumber!).MaximumLength(100));
            When(x => x.ProjectName != null, () => RuleFor(x => x.ProjectName!).MaximumLength(200));
            When(x => x.InvoiceTitle != null, () => RuleFor(x => x.InvoiceTitle!).MaximumLength(100));
            When(x => x.Description != null, () => RuleFor(x => x.Description!).MaximumLength(200));
            When(x => x.ExtraCategorie != null, () => RuleFor(x => x.ExtraCategorie!).MaximumLength(100));

            When(x => x.PersonCount.HasValue, () => RuleFor(x => x.PersonCount!.Value).GreaterThanOrEqualTo(0));
            When(x => x.VatRate.HasValue, () => RuleFor(x => x.VatRate!.Value).InclusiveBetween(0, 100));
            When(x => x.ExcludingVatAmount.HasValue, () => RuleFor(x => x.ExcludingVatAmount!.Value).GreaterThanOrEqualTo(0));
            When(x => x.TotalAmount.HasValue, () => RuleFor(x => x.TotalAmount!.Value).GreaterThanOrEqualTo(0));

            When(x => x.CurrencyCode != null, () =>
                RuleFor(x => x.CurrencyCode!).Must(ExpenseCurrencyCodes.IsAllowed).WithMessage("Geçersiz para birimi."));

            When(x => x.ImagePath != null, () => RuleFor(x => x.ImagePath!).MaximumLength(500));

            When(x => x.Items != null && x.Items.Count > 0, () =>
            {
                RuleForEach(x => x.Items!).ChildRules(item =>
                {
                    item.RuleFor(i => i.ItemName).NotEmpty().MaximumLength(200);
                    item.RuleFor(i => i.Quantity).GreaterThan(0);
                    item.RuleFor(i => i.UnitPrice).GreaterThanOrEqualTo(0);
                    item.RuleFor(i => i.KdvRate).InclusiveBetween(0, 100);
                });
            });
        }
    }
}

