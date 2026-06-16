using Entities.DTOs.ExpenseSettingsDto;
using FluentValidation;

namespace Business.Repository.ExpenseSettingsRepository.Validations
{
    public class UpdateExpenseSettingsDtoValidator : AbstractValidator<UpdateExpenseSettingsDto>
    {
        public UpdateExpenseSettingsDtoValidator()
        {
            RuleFor(x => x.MealAcceptedDailyAmount).GreaterThanOrEqualTo(0).WithMessage("Günlük yemek tutarı 0 veya daha fazla olmalıdır.");
            RuleFor(x => x.PreviousPeriodCutoffDay).InclusiveBetween(1, 31).WithMessage("Önceki dönem son giriş günü 1-31 arasında olmalıdır.");
            RuleFor(x => x.VatRates).NotNull().Must(v => v != null && v.Count >= 1).WithMessage("En az bir KDV oranı gereklidir.");
            RuleForEach(x => x.VatRates).InclusiveBetween(1, 100).When(x => x.VatRates != null && x.VatRates.Count > 0).WithMessage("KDV oranları 1-100 arasında olmalıdır.");
        }
    }
}
