using Entities.DTOs.PollDtos;
using FluentValidation;

namespace Business.Repository.PollRepository.Validations
{
    public class AddPollDtoValidator : AbstractValidator<AddPollDto>
    {
        public AddPollDtoValidator()
        {
            RuleFor(x => x.Title).NotEmpty().WithMessage("Anket başlığı zorunludur.").MaximumLength(300);
            RuleFor(x => x.StartDate).NotEmpty().WithMessage("Başlangıç tarihi zorunludur.");
            RuleFor(x => x.EndDate).GreaterThan(x => x.StartDate).WithMessage("Bitiş tarihi başlangıç tarihinden sonra olmalıdır.");
            RuleFor(x => x.Questions)
                .Must(q => q != null && q.Count >= 1)
                .WithMessage("Ankette en az 1 soru olmalıdır.");
            RuleForEach(x => x.Questions).ChildRules(q =>
            {
                q.RuleFor(x => x.Text).NotEmpty().MaximumLength(500).WithMessage("Soru metni zorunludur.");
                q.RuleFor(x => x.Options)
                    .Must(o => o != null && o.Count(s => !string.IsNullOrWhiteSpace(s)) >= 2)
                    .WithMessage("Her soru en az 2 geçerli seçenek içermelidir.");
            });
            RuleFor(x => x.DepartmentId)
                .Must(id => id.HasValue && id.Value > 0)
                .When(x => !x.IsGeneral)
                .WithMessage("Bölüm seçmelisiniz.");
        }
    }
}
