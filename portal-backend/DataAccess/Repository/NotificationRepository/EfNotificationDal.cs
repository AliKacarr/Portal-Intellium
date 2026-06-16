using Core.DataAccess.EntityFramework;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;
using Entities.Constants;
using Entities.DTOs.NotificationDtos;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Repository.NotificationRepository
{
    public class EfNotificationDal : EfEntityRepositoryBase<Notification, PortalContext>, INotificationDal
    {
        public async Task<IResult> GetAllPaginatedAsync(long userId, int pageNumber, int pageSize, bool hideExpenseAdminQueue)
        {
            using var context = new PortalContext();

            IQueryable<Notification> query = context.Notifications
                .Where(n => n.AssignedUserId == userId);

            if (hideExpenseAdminQueue)
            {
                var adminQueueKey = NotificationTypeKeys.ExpenseReminderAdminQueue.ToLower();
                query = query.Where(n => n.Type == null || n.Type.ToLower() != adminQueueKey);
            }

            var totalCount = await query.CountAsync();
            var paginatedNotifications = await query
                .OrderByDescending(n => n.CreatedDate)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(n => new GetNotificationDto
                {
                    Id = n.Id,
                    Title = n.Title,
                    Content = n.Content,
                    Type = n.Type,
                    IsChecked = n.IsChecked,
                    CreatedAt = n.CreatedDate,
                    TargetId = n.ReferenceId,
                    NavigationData = n.NavigationData
                })
                .ToListAsync();

            return new PaginatedResult<List<GetNotificationDto>>(paginatedNotifications, true)
            {
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalCount = totalCount
            };
        }

        public async Task<int> DeleteAllByAssignedUserIdAsync(long userId)
        {
            using var context = new PortalContext();
            return await context.Notifications
                .Where(n => n.AssignedUserId == userId)
                .ExecuteDeleteAsync();
        }
    }
}