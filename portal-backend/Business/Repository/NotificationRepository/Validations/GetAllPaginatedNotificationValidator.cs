using FluentValidation;
namespace Business.Repository.NotificationRepository.Validations
{
	public class GetAllPaginatedNotificationValidator : AbstractValidator<int>
	{
        public GetAllPaginatedNotificationValidator()
        {
            RuleFor(pageNumber => pageNumber).GreaterThanOrEqualTo(1).WithMessage("Değerler 1'den büyük olmalı.");
        }
    }
}
