using Entities.DTOs.NewsCommentDtos;
using FluentValidation;

namespace Business.Repository.NewsCommentRepository.Validations
{
    public class AddNewsCommentDtoValidator : AbstractValidator<AddNewsCommentDto>
    {
        public AddNewsCommentDtoValidator()
        {
            RuleFor(x => x.Content).NotEmpty().WithMessage("Yorum içeriği zorunludur.").MaximumLength(1000);
            RuleFor(x => x.NewsId).GreaterThan(0).WithMessage("Geçerli bir haber ID giriniz.");
        }
    }
}
