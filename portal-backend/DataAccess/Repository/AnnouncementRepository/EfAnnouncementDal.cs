using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using DataAccess.Helpers;
using Entities.Concrete;
using Entities.DTOs.AnnouncementDtos;
using Entities.DTOs.UserDtos;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Repository.AnnouncementRepository
{
    public class EfAnnouncementDal : EfEntityRepositoryBase<Announcement, PortalContext>, IAnnouncementDal
    {
        public List<GetAnnouncementDto> GetAllAsDto()
        {
            using var context = new PortalContext();
            return BuildQuery(context)
                .OrderByDescending(x => x.CreatedAt)
                .ToList();
        }

        public GetAnnouncementDto GetByIdAsDto(long id)
        {
            using var context = new PortalContext();
            return BuildQuery(context)
                .Where(x => x.Id == id)
                .FirstOrDefault();
        }

        /// <summary>Portal kullanıcısı: herkese açık + kendi iş bölümü (Ar&Ge / Merkez / Dış Kaynak).</summary>
        public List<GetAnnouncementDto> GetActiveAsDtoForPortalUser(long userId)
        {
            using var context = new PortalContext();
            var scope = PortalBolumScope.Resolve(context, userId);
            var today = DateTime.Now;

            return BuildQuery(context)
                .Where(x => x.IsActive && x.ExpiryDate.Date >= today.Date && x.PublishDate <= today)
                .AsEnumerable()
                .Where(x => scope.CanSee(x.IsGeneral, x.DepartmentId, x.DepartmentName, x.ServiceArea))
                .OrderByDescending(x => x.CreatedAt)
                .ToList();
        }

        public void IncrementViewCount(long announcementId)
        {
            using var context = new PortalContext();
            var announcement = context.Announcements.FirstOrDefault(a => a.Id == announcementId);
            if (announcement == null) return;
            announcement.ViewCount++;
            context.SaveChanges();
        }

        public void RecordView(long announcementId, long userId)
        {
            using var context = new PortalContext();
            bool alreadyViewed = context.AnnouncementViews.Any(v => v.AnnouncementId == announcementId && v.UserId == userId);

            if (!alreadyViewed)
            {
                context.AnnouncementViews.Add(new AnnouncementView
                {
                    AnnouncementId = announcementId,
                    UserId = userId,
                    ViewedAt = DateTime.Now
                });

                var announcement = context.Announcements.FirstOrDefault(a => a.Id == announcementId);
                if (announcement != null)
                    announcement.ViewCount++;

                context.SaveChanges();
            }
        }

        public List<ViewerDto> GetViewers(long announcementId)
        {
            using var context = new PortalContext();
            return context.AnnouncementViews
                .Where(v => v.AnnouncementId == announcementId)
                .Join(context.Users, v => v.UserId, u => u.Id, (v, u) => new ViewerDto
                {
                    UserId = u.Id,
                    UserName = u.Name,
                    ViewedAt = v.ViewedAt
                })
                .OrderByDescending(x => x.ViewedAt)
                .ToList();
        }

        private static IQueryable<GetAnnouncementDto> BuildQuery(PortalContext context)
        {
            return
                from a in context.Announcements
                where !a.IsDeleted
                join u in context.Users on a.CreatedByUserId equals u.Id
                join d in context.Departments on a.DepartmentId equals (long?)d.Id into depts
                from dept in depts.DefaultIfEmpty()
                select new GetAnnouncementDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    Content = a.Content,
                    Priority = a.Priority,
                    ExpiryDate = a.ExpiryDate,
                    PublishDate = a.PublishDate,
                    ViewCount = a.ViewCount,
                    IsGeneral = a.IsGeneral,
                    IsActive = a.IsActive,
                    CreatedAt = a.CreatedAt,
                    UpdatedAt = a.UpdatedAt,
                    DepartmentId = a.DepartmentId,
                    DepartmentName = dept != null ? dept.Name : null,
                    ServiceArea = a.ServiceArea,
                    CreatedByUserId = a.CreatedByUserId,
                    CreatedByName = u.Name
                };
        }
    }
}
