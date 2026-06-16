using Business.BusinessAspects;
using Business.Helpers;
using Business.Repository.AnnouncementRepository.Validations;
using Business.Repository.NotificationRepository;
using Core.Aspects.Autofac.Validation;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.AnnouncementRepository;
using DataAccess.Repository.UserJobDetailRepository;
using Entities.Concrete;
using Entities.Constants;
using Entities.DTOs.AnnouncementDtos;
using Entities.DTOs.NotificationDtos;
using Entities.DTOs.UserDtos;
using System.Linq;

namespace Business.Repository.AnnouncementRepository
{
    public class AnnouncementManager : IAnnouncementService
    {
        private readonly IAnnouncementDal _announcementDal;
        private readonly IUserContext _userContext;
        private readonly INotificationService _notificationService;
        private readonly IUserJobDetailDal _userJobDetailDal;

        public AnnouncementManager(
            IAnnouncementDal announcementDal,
            IUserContext userContext,
            INotificationService notificationService,
            IUserJobDetailDal userJobDetailDal)
        {
            _announcementDal = announcementDal;
            _userContext = userContext;
            _notificationService = notificationService;
            _userJobDetailDal = userJobDetailDal;
        }

        private static bool IsAdmin(string? roleName) =>
            string.Equals((roleName ?? string.Empty).Trim(), RoleNames.Admin, StringComparison.OrdinalIgnoreCase);

        [LoggerAspect]
        [SecuredOperation(RoleNames.Admin)]
        public IDataResult<List<GetAnnouncementDto>> GetAll()
        {
            return new SuccessDataResult<List<GetAnnouncementDto>>(_announcementDal.GetAllAsDto());
        }

        [LoggerAspect]
        [SecuredOperation(RoleNames.PortalReaders)]
        public IDataResult<GetAnnouncementDto> GetById(long id)
        {
            var dto = _announcementDal.GetByIdAsDto(id);
            if (dto == null)
                return new ErrorDataResult<GetAnnouncementDto>("Duyuru bulunamadı.");

            if (IsAdmin(_userContext.RoleName))
                return new SuccessDataResult<GetAnnouncementDto>(dto);

            if (!dto.IsActive)
                return new ErrorDataResult<GetAnnouncementDto>("Duyuru bulunamadı.");

            var today = DateTime.Now;
            if (dto.ExpiryDate.Date < today.Date)
                return new ErrorDataResult<GetAnnouncementDto>("Duyuru bulunamadı.");
            if (dto.PublishDate > today)
                return new ErrorDataResult<GetAnnouncementDto>("Duyuru bulunamadı.");

            if (!PortalUserCanSeeAnnouncement(dto))
                return new ErrorDataResult<GetAnnouncementDto>("Duyuru bulunamadı.");

            return new SuccessDataResult<GetAnnouncementDto>(dto);
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.Admin},{RoleNames.Worker},{RoleNames.User}")]
        public IDataResult<List<GetAnnouncementDto>> GetActiveForCurrentUser()
        {
            return new SuccessDataResult<List<GetAnnouncementDto>>(
                _announcementDal.GetActiveAsDtoForPortalUser(_userContext.UserId));
        }

        [LoggerAspect]
        [SecuredOperation(RoleNames.Admin)]
        [ValidationAspect(typeof(AddAnnouncementDtoValidator))]
        public IResult Add(AddAnnouncementDto dto)
        {
            var storedIsGeneral = dto.IsGeneral && !dto.DepartmentId.HasValue;
            var publishDate = dto.PublishDate == default ? DateTime.Now : dto.PublishDate;

            var announcement = new Announcement
            {
                Title = dto.Title,
                Content = dto.Content,
                Priority = dto.Priority.ToLower(),
                ExpiryDate = dto.ExpiryDate,
                PublishDate = publishDate,
                IsGeneral = storedIsGeneral,
                DepartmentId = dto.DepartmentId,
                ServiceArea = null,
                CreatedByUserId = _userContext.UserId,
                IsActive = dto.IsActive,
                CreatedAt = DateTime.Now
            };
            _announcementDal.Add(announcement);

            if (publishDate <= DateTime.Now)
                SendAnnouncementNotification(announcement.Id, dto.Title, storedIsGeneral, dto.DepartmentId);

            return new SuccessResult("Duyuru başarıyla oluşturuldu.");
        }

        [LoggerAspect]
        [SecuredOperation(RoleNames.Admin)]
        [ValidationAspect(typeof(UpdateAnnouncementDtoValidator))]
        public IResult Update(UpdateAnnouncementDto dto)
        {
            var existing = _announcementDal.Get(a => a.Id == dto.Id);
            if (existing == null)
                return new ErrorResult("Duyuru bulunamadı.");

            var storedIsGeneral = dto.IsGeneral && !dto.DepartmentId.HasValue;
            var publishDate = dto.PublishDate == default ? DateTime.Now : dto.PublishDate;

            existing.Title = dto.Title;
            existing.Content = dto.Content;
            existing.Priority = dto.Priority.ToLower();
            existing.ExpiryDate = dto.ExpiryDate;
            existing.PublishDate = publishDate;
            existing.IsGeneral = storedIsGeneral;
            existing.IsActive = dto.IsActive;
            existing.DepartmentId = dto.DepartmentId;
            existing.ServiceArea = null;
            existing.UpdatedAt = DateTime.Now;
            _announcementDal.Update(existing);

            if (dto.IsActive && publishDate <= DateTime.Now)
                SendAnnouncementNotification(existing.Id, dto.Title, storedIsGeneral, dto.DepartmentId);

            return new SuccessResult("Duyuru güncellendi.");
        }

        [LoggerAspect]
        [SecuredOperation(RoleNames.Admin)]
        public IResult Delete(long id)
        {
            var existing = _announcementDal.Get(a => a.Id == id && !a.IsDeleted);
            if (existing == null)
                return new ErrorResult("Duyuru bulunamadı.");

            existing.IsActive = false;
            existing.IsDeleted = true;
            existing.UpdatedAt = DateTime.Now;
            _announcementDal.Update(existing);
            return new SuccessResult("Duyuru silindi.");
        }

        [LoggerAspect]
        public IResult IncrementViewCount(long id)
        {
            _announcementDal.RecordView(id, _userContext.UserId);
            return new SuccessResult();
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.Admin},{RoleNames.Worker}")]
        public IDataResult<List<ViewerDto>> GetViewers(long id)
        {
            return new SuccessDataResult<List<ViewerDto>>(_announcementDal.GetViewers(id));
        }

        private bool PortalUserCanSeeAnnouncement(GetAnnouncementDto dto) =>
            PortalBolumAccess.UserCanSeeContent(
                _userContext.UserId,
                dto.IsGeneral,
                dto.DepartmentId,
                dto.DepartmentName,
                dto.ServiceArea);

        private void SendAnnouncementNotification(long announcementId, string title, bool storedIsGeneral, long? departmentId)
        {
            try
            {
                var template = new AddNotificationDto
                {
                    AssignedUserId = 0,
                    Title = "Yeni Duyuru Yayınlandı",
                    Content = $"'{title}' başlıklı duyuru yayınlandı.",
                    Type = NotificationTypeKeys.Announcement,
                    ReferenceId = announcementId.ToString()
                };

                if (storedIsGeneral)
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
            catch { /* Bildirim hatası duyuruyu engellemesin */ }
        }
    }
}
