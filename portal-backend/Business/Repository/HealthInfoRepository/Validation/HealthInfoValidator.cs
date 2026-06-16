using Entities.Concrete;
using FluentValidation;

namespace Business.Repository.HealthInfoRepository.Validation
{
    public class HealthInfoValidator : AbstractValidator<HealthInfo>
    {
        public HealthInfoValidator()
        {
            RuleFor(x => x.UserId)
                .NotEmpty().WithMessage("Kullanıcı zorunludur.");

            // --- BU SATIR SİLİNDİ ---
            // RuleFor(x => x.InsuranceScope)
            //     .NotEmpty().WithMessage("Sigorta kapsamı zorunludur.");

            RuleFor(x => x.InsuranceCompanyName)
                .NotEmpty().WithMessage("Sigorta şirketi ismi zorunludur.");

            RuleFor(x => x.InsurancePolicyNo)
                .NotEmpty().WithMessage("Sigorta poliçe numarası zorunludur.");

            // --- BU SATIR SİLİNDİ ---
            // RuleFor(x => x.Agency)
            //     .NotEmpty().WithMessage("Sigorta acentesi zorunludur.");

            RuleFor(x => x.InsuranceBeginDate)
                .NotEmpty().WithMessage("Sigorta başlangıç tarihi zorunludur.");

            RuleFor(x => x.InsuranceEndDate)
                .NotEmpty().WithMessage("Sigorta bitiş tarihi zorunludur.")
                .GreaterThan(x => x.InsuranceBeginDate).WithMessage("Bitiş tarihi, başlangıç tarihinden sonra olmalıdır.");

                RuleFor(x => x.AgencyName)
                .NotEmpty().WithMessage("Acente adı zorunludur.");

            RuleFor(x => x.AgencyContactPerson)
                .NotEmpty().WithMessage("Acente yetkilisi zorunludur.");

            RuleFor(x => x.AgencyContactPhone)
                .NotEmpty().WithMessage("Acente telefonu zorunludur.");
        }
    }
}