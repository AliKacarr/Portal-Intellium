using Core.Constants;
using Entities.DTOs.ExpenseDto;
using FluentValidation;

namespace Business.Repository.ExpenseRepository.Validations
{
	public class AddExpenseDtoValidator : AbstractValidator<AddExpenseDto>
	{
		public AddExpenseDtoValidator()
		{
			RuleFor(x => x.UserId).GreaterThan(0);
			RuleFor(x => x.InvoiceNumber).NotEmpty();
			RuleFor(x => x.InvoiceDate).NotEmpty();
			RuleFor(x => x.ProjectName).NotEmpty();
			RuleFor(x => x.InvoiceTitle).NotEmpty();
			RuleFor(x => x.Description).NotEmpty().MaximumLength(200);

			RuleFor(x => x.ExcludingVatAmount).GreaterThanOrEqualTo(0);
			RuleFor(x => x.TotalAmount).GreaterThanOrEqualTo(0);
			RuleFor(x => x.VatRate).InclusiveBetween(0, 100);
			RuleFor(x => x.CurrencyCode).Must(ExpenseCurrencyCodes.IsAllowed).WithMessage("Geçersiz para birimi. ISO 4217 kodu kullanın (örn. TRY, USD, EUR).");
			RuleFor(x => x.PersonCount).GreaterThanOrEqualTo(1).WithMessage("Kişi sayısı en az 1 olmalıdır.");

			// Yemek / Ulaşım: aynı PersonCount kolonu
			When(x => x.InvoiceTitle == "Yemek" || x.InvoiceTitle == "Ulaşım", () => {
				RuleFor(x => x.PersonCount).GreaterThan(0).WithMessage("Kişi sayısı girmelisiniz.");
			});
			When(x => x.InvoiceTitle == "Yemek", () => {
				RuleFor(x => x.MealPersonNames).NotEmpty().WithMessage("Katılımcı isimlerini girmelisiniz.");
			});

			// "Diğer" kategorisi için alt kategori opsiyonel ama gelirse sınırla
			When(x => x.InvoiceTitle == "Diğer" && x.ExtraCategorie != null, () => {
				RuleFor(x => x.ExtraCategorie).MaximumLength(100).WithMessage("Alt kategori en fazla 100 karakter olabilir.");
			});

			When(x => x.Items != null && x.Items.Count > 0, () => {
				RuleForEach(x => x.Items).ChildRules(item =>
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

