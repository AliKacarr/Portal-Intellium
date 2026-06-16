using Entities.DTOs.NewsDtos;
using FluentValidation;

namespace Business.Repository.NewsRepository.Validations
{
    public class UpdateNewsDtoValidator : AbstractValidator<UpdateNewsDto>
    {
        public UpdateNewsDtoValidator()
        {
            RuleFor(x => x.Id).GreaterThan(0).WithMessage("Geçerli bir haber ID giriniz.");
            RuleFor(x => x.Title).NotEmpty().WithMessage("Haber başlığı zorunludur.").MaximumLength(300);
            RuleFor(x => x.Content).NotEmpty().WithMessage("Haber içeriği zorunludur.");
        }
    }
}
