using Core.Utilities.Results.Abstract;
using Entities.DTOs.NotificationDtos;

namespace Business.Repository.NotificationRepository
{
	public interface INotificationService
	{
		/// <summary>Tüm aktif kullanıcılara aynı bildirimi oluşturur (iç servis; HTTP yetkisi ayrı).</summary>
		IResult BroadcastToAllActiveUsers(AddNotificationDto template);

		/// <summary>Belirli bir departmandaki aktif kullanıcılara bildirim gönderir.</summary>
		IResult BroadcastToDepartment(long departmentId, AddNotificationDto template);

		/// <summary>İş profilinde hizmet alanı eşleşen aktif çalışanlara bildirim gönderir.</summary>
		IResult BroadcastToServiceArea(string serviceArea, AddNotificationDto template);

		IResult Add(AddNotificationDto addNotificationDto);
		IResult AddAll(List<AddNotificationDto> addNotificationDtos);
		IResult Delete(long id);
		Task<IResult> DeleteAllForCurrentUserAsync();
		Task<IResult> GetAllPaginated(int pageNumber, int pageSize);
		IResult MarkAsRead(long notificationId);
	}
}
