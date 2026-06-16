using Core.DataAccess;
using Core.Utilities.Results.Abstract;
using Entities.Concrete;

namespace DataAccess.Repository.NotificationRepository
{
	public interface INotificationDal : IEntityRepository<Notification>
	{
		Task<IResult> GetAllPaginatedAsync(long userId, int pageNumber, int pageSize, bool hideExpenseAdminQueue);
		Task<int> DeleteAllByAssignedUserIdAsync(long userId);
	}
}
