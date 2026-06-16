using Entities.DTOs.AnnouncementDtos;
using FluentValidation;

namespace Business.Repository.AnnouncementRepository.Validations
{
    public class UpdateAnnouncementDtoValidator : AbstractValidator<UpdateAnnouncementDto>
    {
        private static readonly string[] ValidPriorities = { "low", "medium", "high" };

        public UpdateAnnouncementDtoValidator()
        {
            RuleFor(x => x.Id).GreaterThan(0).WithMessage("Geçerli bir duyuru ID giriniz.");
            RuleFor(x => x.Title).NotEmpty().WithMessage("Duyuru başlığı zorunludur.").MaximumLength(300);
            RuleFor(x => x.Content).NotEmpty().WithMessage("Duyuru içeriği zorunludur.");
            RuleFor(x => x.Priority).NotEmpty().Must(p => ValidPriorities.Contains(p?.ToLower()))
                .WithMessage("Öncelik 'low', 'medium' veya 'high' olmalıdır.");
            RuleFor(x => x.PublishDate).NotEmpty().WithMessage("Yayın tarihi zorunludur.");
            RuleFor(x => x.ExpiryDate)
                .GreaterThan(x => x.PublishDate)
                .WithMessage("Geçerlilik tarihi yayın tarihinden sonra olmalıdır.");
        }
    }
}
