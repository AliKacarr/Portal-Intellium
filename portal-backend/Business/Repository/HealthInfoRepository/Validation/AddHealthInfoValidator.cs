using Entities.DTOs.HealthInfoDtos;
using FluentValidation;

namespace Business.Repository.HealthInfoRepository.Validation
{
    public class AddHealthInfoValidator : AbstractValidator<AddHealthInfoDto>
    {
        public AddHealthInfoValidator()
        {
            RuleFor(h => h.UserId).NotEmpty().WithMessage("Kullanıcı ID'si boş olamaz.");
            RuleFor(h => h.InsuranceCompanyName).NotEmpty().WithMessage("Sigorta şirketi adı boş olamaz.");
            RuleFor(h => h.InsurancePolicyNo).NotEmpty().WithMessage("Poliçe numarası boş olamaz.");
            RuleFor(h => h.InsuranceBeginDate).NotEmpty().WithMessage("Poliçe başlangıç tarihi boş olamaz.");
            RuleFor(h => h.InsuranceEndDate).NotEmpty().WithMessage("Poliçe bitiş tarihi boş olamaz.")
                .GreaterThan(h => h.InsuranceBeginDate).WithMessage("Bitiş tarihi, başlangıç tarihinden sonra olmalıdır.");

            // --- YENİ ZORUNLU ALANLAR ---
            RuleFor(h => h.AgencyName).NotEmpty().WithMessage("Acente adı zorunludur.");
            RuleFor(h => h.AgencyContactPerson).NotEmpty().WithMessage("Acente yetkilisi zorunludur.");
            RuleFor(h => h.AgencyContactPhone).NotEmpty().WithMessage("Acente telefonu zorunludur.");
        }
    }
}