using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using DataAccess.Helpers;
using Entities.Concrete;
using Entities.DTOs.NewsDtos;
using Entities.DTOs.UserDtos;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Repository.NewsRepository
{
    public class EfNewsDal : EfEntityRepositoryBase<News, PortalContext>, INewsDal
    {
        public List<NewsListDto> GetAllAsDto(bool publishedOnly = true)
        {
            using var context = new PortalContext();
            var query =
                from n in context.NewsItems
                where !n.IsDeleted && (!publishedOnly || (n.IsActive && n.IsPublished && n.PublishDate <= DateTime.Now))
                join u in context.Users on n.CreatedById equals u.Id
                join d in context.Departments on n.DepartmentId equals (long?)d.Id into depts
                from dept in depts.DefaultIfEmpty()
                join c in context.NewsCategories on n.NewsCategoryId equals (long?)c.Id into cats
                from cat in cats.DefaultIfEmpty()
                orderby n.PublishDate descending
                select new NewsListDto
                {
                    Id = n.Id,
                    Title = n.Title,
                    Content = n.Content,
                    ImageUrl = n.ImageUrl,
                    PublishDate = n.PublishDate,
                    IsPublished = n.IsPublished,
                    IsCommentable = n.IsCommentable,
                    IsGeneral = n.IsGeneral,
                    Tags = n.Tags,
                    ViewCount = n.ViewCount,
                    IsActive = n.IsActive,
                    DepartmentId = n.DepartmentId,
                    CreatedByName = u.Name,
                    CreatedById = n.CreatedById,
                    DepartmentName = dept != null ? dept.Name : null,
                    ServiceArea = n.ServiceArea,
                    NewsCategoryName = cat != null ? cat.Name : null,
                    CreatedAt = n.CreatedAt
                };

            return query.ToList();
        }

        public List<NewsListDto> GetAllAsDtoForPortalUser(bool publishedOnly, long userId)
        {
            using var context = new PortalContext();
            var scope = PortalBolumScope.Resolve(context, userId);
            var now = DateTime.Now;

            var rows =
                from n in context.NewsItems
                where !n.IsDeleted && n.IsActive
                join u in context.Users on n.CreatedById equals u.Id
                join d in context.Departments on n.DepartmentId equals (long?)d.Id into depts
                from dept in depts.DefaultIfEmpty()
                join c in context.NewsCategories on n.NewsCategoryId equals (long?)c.Id into cats
                from cat in cats.DefaultIfEmpty()
                orderby n.PublishDate descending
                select new
                {
                    n.Id,
                    n.Title,
                    n.ImageUrl,
                    n.PublishDate,
                    n.IsPublished,
                    n.IsGeneral,
                    n.Tags,
                    n.ViewCount,
                    n.CreatedById,
                    n.DepartmentId,
                    n.ServiceArea,
                    n.IsActive,
                    CreatedByName = u.Name,
                    DepartmentName = dept != null ? dept.Name : null,
                    NewsCategoryName = cat != null ? cat.Name : null,
                    n.CreatedAt
                };

            var list = rows.ToList();
            return list
                .Where(n =>
                {
                    if (publishedOnly && (!n.IsPublished || n.PublishDate > now))
                        return false;
                    return scope.CanSee(n.IsGeneral, n.DepartmentId, n.DepartmentName, n.ServiceArea);
                })
                .Select(n => new NewsListDto
                {
                    Id = n.Id,
                    Title = n.Title,
                    ImageUrl = n.ImageUrl,
                    PublishDate = n.PublishDate,
                    IsPublished = n.IsPublished,
                    IsGeneral = n.IsGeneral,
                    Tags = n.Tags,
                    ViewCount = n.ViewCount,
                    CreatedByName = n.CreatedByName,
                    CreatedById = n.CreatedById,
                    DepartmentName = n.DepartmentName,
                    ServiceArea = n.ServiceArea,
                    NewsCategoryName = n.NewsCategoryName,
                    CreatedAt = n.CreatedAt
                })
                .ToList();
        }

        public GetNewsDto GetByIdAsDto(long id)
        {
            using var context = new PortalContext();
            var query =
                from n in context.NewsItems
                where n.Id == id && !n.IsDeleted
                join u in context.Users on n.CreatedById equals u.Id
                join d in context.Departments on n.DepartmentId equals (long?)d.Id into depts
                from dept in depts.DefaultIfEmpty()
                join c in context.NewsCategories on n.NewsCategoryId equals (long?)c.Id into cats
                from cat in cats.DefaultIfEmpty()
                select new GetNewsDto
                {
                    Id = n.Id,
                    Title = n.Title,
                    Content = n.Content,
                    ImageUrl = n.ImageUrl,
                    PublishDate = n.PublishDate,
                    IsPublished = n.IsPublished,
                    IsCommentable = n.IsCommentable,
                    IsGeneral = n.IsGeneral,
                    Tags = n.Tags,
                    ViewCount = n.ViewCount,
                    IsActive = n.IsActive,
                    CreatedAt = n.CreatedAt,
                    UpdatedAt = n.UpdatedAt,
                    CreatedById = n.CreatedById,
                    CreatedByName = u.Name,
                    DepartmentId = n.DepartmentId,
                    DepartmentName = dept != null ? dept.Name : null,
                    ServiceArea = n.ServiceArea,
                    NewsCategoryId = n.NewsCategoryId,
                    NewsCategoryName = cat != null ? cat.Name : null
                };

            return query.FirstOrDefault();
        }

        public List<NewsListDto> GetByDepartment(long departmentId)
        {
            using var context = new PortalContext();
            var query =
                from n in context.NewsItems
                where !n.IsDeleted && n.IsActive && n.IsPublished && n.PublishDate <= DateTime.Now && n.DepartmentId == departmentId
                join u in context.Users on n.CreatedById equals u.Id
                join d in context.Departments on n.DepartmentId equals (long?)d.Id into depts
                from dept in depts.DefaultIfEmpty()
                join c in context.NewsCategories on n.NewsCategoryId equals (long?)c.Id into cats
                from cat in cats.DefaultIfEmpty()
                orderby n.PublishDate descending
                select new NewsListDto
                {
                    Id = n.Id,
                    Title = n.Title,
                    ImageUrl = n.ImageUrl,
                    PublishDate = n.PublishDate,
                    IsPublished = n.IsPublished,
                    IsGeneral = n.IsGeneral,
                    Tags = n.Tags,
                    ViewCount = n.ViewCount,
                    CreatedByName = u.Name,
                    CreatedById = n.CreatedById,
                    DepartmentName = dept != null ? dept.Name : null,
                    ServiceArea = n.ServiceArea,
                    NewsCategoryName = cat != null ? cat.Name : null,
                    CreatedAt = n.CreatedAt
                };

            return query.ToList();
        }

        public void IncrementViewCount(long newsId)
        {
            using var context = new PortalContext();
            var news = context.NewsItems.FirstOrDefault(n => n.Id == newsId);
            if (news == null) return;
            news.ViewCount++;
            context.SaveChanges();
        }

        public void RecordView(long newsId, long userId)
        {
            using var context = new PortalContext();
            bool alreadyViewed = context.NewsViews.Any(v => v.NewsId == newsId && v.UserId == userId);
            
            if (!alreadyViewed)
            {
                context.NewsViews.Add(new NewsView
                {
                    NewsId = newsId,
                    UserId = userId,
                    ViewedAt = DateTime.Now
                });
                
                var news = context.NewsItems.FirstOrDefault(n => n.Id == newsId);
                if (news != null)
                {
                    news.ViewCount++;
                }
                
                context.SaveChanges();
            }
        }

        public List<ViewerDto> GetViewers(long newsId)
        {
            using var context = new PortalContext();
            return context.NewsViews
                .Where(v => v.NewsId == newsId)
                .Join(context.Users, v => v.UserId, u => u.Id, (v, u) => new ViewerDto
                {
                    UserId = u.Id,
                    UserName = u.Name,
                    ViewedAt = v.ViewedAt
                })
                .OrderByDescending(x => x.ViewedAt)
                .ToList();
        }
    }
}
