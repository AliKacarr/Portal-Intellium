using Entities.DTOs.NewsDtos;
using FluentValidation;

namespace Business.Repository.NewsRepository.Validations
{
    public class AddNewsDtoValidator : AbstractValidator<AddNewsDto>
    {
        public AddNewsDtoValidator()
        {
            RuleFor(x => x.Title).NotEmpty().WithMessage("Haber başlığı zorunludur.").MaximumLength(300);
            RuleFor(x => x.Content).NotEmpty().WithMessage("Haber içeriği zorunludur.");
        }
    }
}
