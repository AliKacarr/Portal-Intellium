using Business.Repository.NotificationRepository.Constants;
using Core.Identity;
using Core.Utilities.Exceptions;
using DataAccess.Repository.NotificationRepository;
using Entities.Concrete;
using FluentValidation;

namespace Business.Repository.NotificationRepository.Validations
{
	public class MarkAsReadNotificationValidator : AbstractValidator<long>
	{
		private readonly INotificationDal _notificationDal;
		private readonly IUserContext _userContext;
		private Notification? _cachedNotification;
		public MarkAsReadNotificationValidator(INotificationDal notificationDal, IUserContext userContext)
		{
			_notificationDal = notificationDal;
			_userContext = userContext;

			RuleFor(id => id)
				.Cascade(CascadeMode.Stop)
				.Must(NotificationExists).WithMessage(NotificationMessages.NotificationNotFound)
				.Must(UserHasPermission)
				.Must(NotificationNotRead).WithMessage(NotificationMessages.NotificationAlreadyRead);

		}

		private bool NotificationExists(long id)
		{
			_cachedNotification = _notificationDal.Get(n => n.Id == id);
			return _cachedNotification != null;
		}
		private bool UserHasPermission(long id)
		{
			var notification = _cachedNotification ?? _notificationDal.Get(n => n.Id == id);
			if (notification.AssignedUserId == _userContext.UserId)
				return true;
			throw new ForbiddenAccessException();
		}
		private bool NotificationNotRead(long id)
		{
			var notification = _cachedNotification ?? _notificationDal.Get(n => n.Id == id);
			return !notification.IsChecked;
		}
	}
}
