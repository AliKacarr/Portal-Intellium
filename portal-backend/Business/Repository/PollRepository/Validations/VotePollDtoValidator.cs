using Entities.DTOs.PollDtos;
using FluentValidation;

namespace Business.Repository.PollRepository.Validations
{
    public class VotePollDtoValidator : AbstractValidator<VotePollDto>
    {
        public VotePollDtoValidator()
        {
            RuleFor(x => x.PollId).GreaterThan(0).WithMessage("Geçerli bir anket ID giriniz.");
            RuleFor(x => x.Votes).NotEmpty().WithMessage("En az bir oy gönderilmelidir.");
            RuleForEach(x => x.Votes).ChildRules(v =>
            {
                v.RuleFor(x => x.PollQuestionId).GreaterThan(0).WithMessage("Geçerli bir soru ID giriniz.");
                v.RuleFor(x => x.PollOptionId).GreaterThan(0).WithMessage("Geçerli bir seçenek ID giriniz.");
            });
        }
    }
}
