using Business.BusinessAspects;
using Business.Helpers;
using Business.Repository.NewsRepository.Validations;
using Business.Repository.NotificationRepository;
using Core.Aspects.Autofac.Validation;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.NewsRepository;
using DataAccess.Repository.UserJobDetailRepository;
using Entities.Concrete;
using Entities.Constants;
using Entities.DTOs.NewsDtos;
using Entities.DTOs.NotificationDtos;
using Entities.DTOs.UserDtos;
using System.Linq;

namespace Business.Repository.NewsRepository
{
    public class NewsManager : INewsService
    {
        private readonly INewsDal _newsDal;
        private readonly IUserContext _userContext;
        private readonly INotificationService _notificationService;
        private readonly IUserJobDetailDal _userJobDetailDal;

        public NewsManager(
            INewsDal newsDal,
            IUserContext userContext,
            INotificationService notificationService,
            IUserJobDetailDal userJobDetailDal)
        {
            _newsDal = newsDal;
            _userContext = userContext;
            _notificationService = notificationService;
            _userJobDetailDal = userJobDetailDal;
        }

        private static bool IsAdmin(string? roleName) =>
            string.Equals((roleName ?? string.Empty).Trim(), RoleNames.Admin, StringComparison.OrdinalIgnoreCase);

        [LoggerAspect]
        [SecuredOperation(RoleNames.PortalReaders)]
        public IDataResult<List<NewsListDto>> GetAll(bool publishedOnly = true)
        {
            if (publishedOnly)
            {
                if (IsAdmin(_userContext.RoleName))
                    return new SuccessDataResult<List<NewsListDto>>(_newsDal.GetAllAsDto(publishedOnly));

                var filtered = _newsDal.GetAllAsDtoForPortalUser(publishedOnly, _userContext.UserId);
                return new SuccessDataResult<List<NewsListDto>>(filtered);
            }

            if (!IsAdmin(_userContext.RoleName))
                return new ErrorDataResult<List<NewsListDto>>("Bu listeyi görüntüleme yetkiniz yok.");

            return new SuccessDataResult<List<NewsListDto>>(_newsDal.GetAllAsDto(publishedOnly));
        }

        [LoggerAspect]
        [SecuredOperation(RoleNames.PortalReaders)]
        public IDataResult<GetNewsDto> GetById(long id)
        {
            var dto = _newsDal.GetByIdAsDto(id);
            if (dto == null)
                return new ErrorDataResult<GetNewsDto>("Haber bulunamadı.");

            if (!IsAdmin(_userContext.RoleName))
            {
                if (!dto.IsActive || !dto.IsPublished || dto.PublishDate > DateTime.Now)
                    return new ErrorDataResult<GetNewsDto>("Haber bulunamadı.");
                if (!PortalUserCanSeeNews(dto))
                    return new ErrorDataResult<GetNewsDto>("Haber bulunamadı.");
            }

            return new SuccessDataResult<GetNewsDto>(dto);
        }

        [LoggerAspect]
        [SecuredOperation(RoleNames.PortalReaders)]
        public IDataResult<List<NewsListDto>> GetByDepartment(long departmentId)
        {
            return new SuccessDataResult<List<NewsListDto>>(_newsDal.GetByDepartment(departmentId));
        }

        [LoggerAspect]
        [SecuredOperation(RoleNames.Admin)]
        [ValidationAspect(typeof(AddNewsDtoValidator))]
        public IResult Add(AddNewsDto dto)
        {
            var storedIsGeneral = dto.IsGeneral && !dto.DepartmentId.HasValue;
            var publishDate = dto.PublishDate ?? DateTime.Now;

            var news = new News
            {
                Title = dto.Title,
                Content = dto.Content,
                ImageUrl = dto.ImageUrl,
                PublishDate = publishDate,
                IsPublished = dto.IsPublished,
                IsCommentable = dto.IsCommentable,
                IsGeneral = storedIsGeneral,
                Tags = dto.Tags,
                DepartmentId = dto.DepartmentId,
                ServiceArea = null,
                NewsCategoryId = dto.NewsCategoryId,
                CreatedById = _userContext.UserId,
                IsActive = dto.IsActive,
                CreatedAt = DateTime.Now
            };
            _newsDal.Add(news);

            if (dto.IsPublished && publishDate <= DateTime.Now)
                NotifyUsersAboutNews(news.Id, dto.Title, storedIsGeneral, dto.DepartmentId);

            return new SuccessResult("Haber başarıyla oluşturuldu.");
        }

        [LoggerAspect]
        [SecuredOperation(RoleNames.Admin)]
        [ValidationAspect(typeof(UpdateNewsDtoValidator))]
        public IResult Update(UpdateNewsDto dto)
        {
            var existing = _newsDal.Get(n => n.Id == dto.Id);
            if (existing == null)
                return new ErrorResult("Haber bulunamadı.");

            var now = DateTime.Now;
            bool wasUnpublished = !existing.IsPublished;
            bool wasScheduled = existing.IsPublished && existing.PublishDate > now;

            var storedIsGeneral = dto.IsGeneral && !dto.DepartmentId.HasValue;
            var publishDate = dto.PublishDate ?? now;

            existing.Title = dto.Title;
            existing.Content = dto.Content;
            existing.ImageUrl = dto.ImageUrl;
            existing.PublishDate = publishDate;
            existing.IsPublished = dto.IsPublished;
            existing.IsCommentable = dto.IsCommentable;
            existing.IsGeneral = storedIsGeneral;
            existing.Tags = dto.Tags;
            existing.DepartmentId = dto.DepartmentId;
            existing.ServiceArea = null;
            existing.NewsCategoryId = dto.NewsCategoryId;
            if (dto.IsActive)
                existing.IsActive = true;
            existing.UpdatedAt = DateTime.Now;
            _newsDal.Update(existing);

            if (dto.IsPublished && publishDate <= now && (wasUnpublished || wasScheduled))
                NotifyUsersAboutNews(existing.Id, dto.Title, storedIsGeneral, dto.DepartmentId);

            return new SuccessResult("Haber güncellendi.");
        }

        [LoggerAspect]
        [SecuredOperation(RoleNames.Admin)]
        public IResult Delete(long id)
        {
            var existing = _newsDal.Get(n => n.Id == id && !n.IsDeleted);
            if (existing == null)
                return new ErrorResult("Haber bulunamadı.");

            existing.IsDeleted = true;
            existing.UpdatedAt = DateTime.Now;
            _newsDal.Update(existing);
            return new SuccessResult("Haber silindi.");
        }

        [LoggerAspect]
        public IResult IncrementViewCount(long id)
        {
            _newsDal.RecordView(id, _userContext.UserId);
            return new SuccessResult();
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.Admin},{RoleNames.Worker}")]
        public IDataResult<List<ViewerDto>> GetViewers(long id)
        {
            return new SuccessDataResult<List<ViewerDto>>(_newsDal.GetViewers(id));
        }

        private bool PortalUserCanSeeNews(GetNewsDto dto) =>
            PortalBolumAccess.UserCanSeeContent(
                _userContext.UserId,
                dto.IsGeneral,
                dto.DepartmentId,
                dto.DepartmentName,
                dto.ServiceArea);

        private void NotifyUsersAboutNews(long newsId, string newsTitle, bool isGeneral, long? departmentId)
        {
            try
            {
                var template = new AddNotificationDto
                {
                    AssignedUserId = 0,
                    Title = "Yeni Haber Yayınlandı",
                    Content = $"'{newsTitle}' başlıklı haber yayınlandı.",
                    Type = NotificationTypeKeys.News,
                    ReferenceId = newsId.ToString()
                };

                if (isGeneral)
                {
                    _notificationService.BroadcastToAllActiveUsers(template);
                    return;
                }

                if (departmentId.HasValue)
                {
                    _notificationService.BroadcastToDepartment(departmentId.Value, template);
                    return;
                }

                _notificationService.BroadcastToAllActiveUsers(template);
            }
            catch { /* Bildirim hatası haberin oluşturulmasını engellemesin */ }
        }
    }
}
