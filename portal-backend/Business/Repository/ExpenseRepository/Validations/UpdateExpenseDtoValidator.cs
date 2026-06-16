using Core.Constants;
using Entities.DTOs.ExpenseDto;
using FluentValidation;

namespace Business.Repository.ExpenseRepository.Validations
{
	public class UpdateExpenseDtoValidator : AbstractValidator<UpdateExpenseDto>
	{
		public UpdateExpenseDtoValidator()
		{
			RuleFor(x => x.Id).GreaterThan(0);
			RuleFor(x => x.UserId).GreaterThan(0);
			RuleFor(x => x.InvoiceNumber).NotEmpty();
			RuleFor(x => x.InvoiceDate).NotEmpty();
			RuleFor(x => x.ProjectName).NotEmpty();
			RuleFor(x => x.InvoiceTitle).NotEmpty();
			RuleFor(x => x.ExpenseType).NotEmpty();
			RuleFor(x => x.Description).NotEmpty().MaximumLength(200);

			RuleFor(x => x.ExcludingVatAmount).GreaterThanOrEqualTo(0);
			RuleFor(x => x.TotalAmount).GreaterThanOrEqualTo(0);
			RuleFor(x => x.VatRate).InclusiveBetween(0, 100);
			RuleFor(x => x.CurrencyCode).Must(ExpenseCurrencyCodes.IsAllowed).WithMessage("Geçersiz para birimi. ISO 4217 kodu kullanın (örn. TRY, USD, EUR).");

			// "Diğer" kategorisi için alt kategori opsiyonel ama gelirse sınırla
			When(x => x.InvoiceTitle == "Diğer" && x.ExtraCategorie != null, () => {
				RuleFor(x => x.ExtraCategorie).MaximumLength(100).WithMessage("Alt kategori en fazla 100 karakter olabilir.");
			});
		}
	}
}

