using Entities.DTOs.RequestDtos;
using FluentValidation;

namespace Business.Repository.RequestRepository.Validations
{
    public class CreateRequestDtoValidator : AbstractValidator<CreateRequestDto>
    {
        public CreateRequestDtoValidator()
        {
            RuleFor(x => x.CategoryId).GreaterThan(0).WithMessage("Kategori zorunludur.");
            RuleFor(x => x.SubCategoryId).GreaterThan(0).WithMessage("Alt kategori zorunludur.");

            // "Diğer" seçimi: backend tarafında kategori/subcategory kontrolü manager'da yapılacak.
            // Burada sadece Description boşsa reddedilmesi için koşullu kuralı taşıyoruz:
            RuleFor(x => x.Description)
                .NotEmpty()
                .When(x => !string.IsNullOrWhiteSpace(x.OtherText))
                .WithMessage("Açıklama zorunludur.");
        }
    }
}

