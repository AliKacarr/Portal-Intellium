using Business.BusinessAspects;
using Business.Helpers;
using Business.Repository.MailRepository;
using Business.Repository.NotificationRepository.Constants;
using Business.Repository.NotificationRepository.Validations;
using Business.Repository.UserRepository;
using Core.Aspects.Autofac.Validation;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.DepartmentRepository;
using DataAccess.Repository.NotificationRepository;
using DataAccess.Repository.UserJobDetailRepository;
using DataAccess.Repository.UserRepository;
using Entities.Constants;
using Entities.Concrete;
using Entities.DTOs;
using Entities.DTOs.NotificationDtos;
using Microsoft.Extensions.Logging;
using System.Net;

namespace Business.Repository.NotificationRepository
{
    public class NotificationManager : INotificationService
    {
        /// <summary>Portal kullanıcı bildirimleri: user, worker, admin ve dış kaynak worker.</summary>
        private const string PortalNotificationRoles =
            $"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin},{RoleNames.WorkerOutsource}";

        private readonly INotificationDal _notificationDal;
        private readonly IUserDal _userDal;
        private readonly IUserService _userService;
        private readonly IUserContext _userContext;
        private readonly IMailService _mailService;
        private readonly ISmtpMailParametersProvider _smtpMailParametersProvider;
        private readonly ILogger<NotificationManager> _logger;
        private readonly IUserJobDetailDal _userJobDetailDal;
        private readonly IDepartmentDal _departmentDal;

        public NotificationManager(
            INotificationDal notificationDal,
            IUserDal userDal,
            IUserService userService,
            IUserContext userContext,
            IMailService mailService,
            ISmtpMailParametersProvider smtpMailParametersProvider,
            ILogger<NotificationManager> logger,
            IUserJobDetailDal userJobDetailDal,
            IDepartmentDal departmentDal)
        {
            _notificationDal = notificationDal;
            _userDal = userDal;
            _userService = userService;
            _userContext = userContext;
            _mailService = mailService;
            _smtpMailParametersProvider = smtpMailParametersProvider;
            _logger = logger;
            _userJobDetailDal = userJobDetailDal;
            _departmentDal = departmentDal;
        }

        public IResult BroadcastToAllActiveUsers(AddNotificationDto template)
        {
            var users = _userDal.GetAll(u => u.IsActive);
            foreach (var user in users)
            {
                Add(new AddNotificationDto
                {
                    AssignedUserId = user.Id,
                    Title = template.Title,
                    Content = template.Content,
                    Type = template.Type,
                    ReferenceId = template.ReferenceId,
                    NavigationData = template.NavigationData
                });
            }

            return new SuccessResult();
        }

        public IResult BroadcastToDepartment(long departmentId, AddNotificationDto template)
        {
            var department = _departmentDal.Get(d => d.Id == departmentId && d.IsActive);
            if (department == null)
                return new ErrorResult("Departman bulunamadı.");

            // UserJobDetail.Department (string) ile Department.Name eşleştirme
            var jobDetails = _userJobDetailDal.GetAll(jd =>
                jd.IsActive && jd.Department == department.Name);

            var userIds = jobDetails.Select(jd => jd.UserId).Distinct().ToList();

            var activeUsers = _userDal.GetAll(u => u.IsActive && userIds.Contains(u.Id));
            foreach (var user in activeUsers)
            {
                Add(new AddNotificationDto
                {
                    AssignedUserId = user.Id,
                    Title = template.Title,
                    Content = template.Content,
                    Type = template.Type,
                    ReferenceId = template.ReferenceId,
                    NavigationData = template.NavigationData
                });
            }

            return new SuccessResult();
        }

        public IResult BroadcastToServiceArea(string serviceArea, AddNotificationDto template)
        {
            if (string.IsNullOrWhiteSpace(serviceArea))
                return new ErrorResult("Hizmet alanı boş.");

            var area = serviceArea.Trim();
            var jobDetails = _userJobDetailDal.GetAll(jd =>
                jd.IsActive &&
                jd.ServiceArea != null &&
                jd.ServiceArea.Trim() == area);

            var userIds = jobDetails.Select(jd => jd.UserId).Distinct().ToList();
            var activeUsers = _userDal.GetAll(u => u.IsActive && userIds.Contains(u.Id));
            foreach (var user in activeUsers)
            {
                Add(new AddNotificationDto
                {
                    AssignedUserId = user.Id,
                    Title = template.Title,
                    Content = template.Content,
                    Type = template.Type,
                    ReferenceId = template.ReferenceId,
                    NavigationData = template.NavigationData
                });
            }

            return new SuccessResult();
        }

        public IResult Add(AddNotificationDto addNotificationDto)
        {
            var isUserExists = _userService.GetById(addNotificationDto.AssignedUserId);
            if (isUserExists.Data == null)
                return new ErrorResult(NotificationMessages.AssignedUserNotFound);

            Notification notification = new()
            {
                IsChecked = false,
                AssignedUserId = addNotificationDto.AssignedUserId,
                CreatedDate = DateTime.UtcNow,
                Content = addNotificationDto.Content,
                Title = addNotificationDto.Title,
                Type = addNotificationDto.Type,
                // ReferenceId Eşleştirmesi
                ReferenceId = addNotificationDto.ReferenceId,
                NavigationData = addNotificationDto.NavigationData
            };
            _notificationDal.Add(notification);

            TrySendMirrorEmailForExpenseReminder(addNotificationDto, isUserExists.Data);

            return new SuccessResult();
        }

        public IResult AddAll(List<AddNotificationDto> addNotificationDtos)
        {
            foreach (var notificationDto in addNotificationDtos)
            {
                AddNotificationDto addNotificationDto = new()
                {
                    AssignedUserId = notificationDto.AssignedUserId,
                    Title = notificationDto.Title,
                    Content = notificationDto.Content,
                    Type = notificationDto.Type,
                    // ReferenceId Eşleştirmesi
                    ReferenceId = notificationDto.ReferenceId,
                    NavigationData = notificationDto.NavigationData
                };
                Add(addNotificationDto);
            }

            return new SuccessResult();
        }

        /// <summary>Masraf hatırlatmalarında bildirimle aynı içeriği atanan kullanıcının e-postasına gönderir.</summary>
        private void TrySendMirrorEmailForExpenseReminder(AddNotificationDto dto, User assignee)
        {
            if (!IsExpenseReminderMirrorType(dto.Type))
                return;

            var to = assignee.Email?.Trim();
            if (string.IsNullOrWhiteSpace(to))
            {
                _logger.LogWarning("expensereminder: kullanıcı {UserId} için Users.Email boş; mail atlanıyor.", dto.AssignedUserId);
                return;
            }

            var mp = _smtpMailParametersProvider.GetUsableParameters();
            if (mp == null)
            {
                _logger.LogWarning(
                    "expensereminder e-postası gönderilemedi: SMTP yok. Smtp:Password (veya user-secrets / Smtp__Password) ve MailParameters tablosunu kontrol edin.");
                return;
            }

            var title = string.IsNullOrWhiteSpace(dto.Title) ? "Bildirim" : dto.Title!.Trim();
            var requestId = (dto.ReferenceId ?? "").Trim();

            if (string.IsNullOrWhiteSpace(requestId))
            {
                _logger.LogWarning("expensereminder: ReferenceId boş; mail formatlanamadı. AssignedUserId={UserId}", dto.AssignedUserId);
                return;
            }

            var display8 = RequestDisplayCode.FormatRequestDisplayCode8(requestId);

            // Content içinden "Talep eden: {Ad Soyad}" bilgisini çek (yoksa boş geç).
            string requester = "";
            var content = dto.Content ?? "";
            var marker = "Talep eden:";
            var idx = content.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
            if (idx >= 0)
                requester = content[(idx + marker.Length)..].Trim();
            if (string.IsNullOrWhiteSpace(requester))
                requester = assignee.Name?.Trim() ?? "";

            // İstenen SMTP formatı
            var subject = $"{title} · Talep {display8}" + (string.IsNullOrWhiteSpace(requester) ? "" : $" · {requester}");
            var body = $"{title} · Talep {display8}" + (string.IsNullOrWhiteSpace(requester) ? "" : $" · {requester}");

            try
            {
                _mailService.SendMail(new SendMailDto
                {
                    MailParameters = mp,
                    ToEmail = to,
                    Subject = subject,
                    Body = body
                });
                _logger.LogInformation("expensereminder e-postası gönderildi. Gönderen={From}, Alıcı={To}", mp.FromEmail, to);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "expensereminder e-postası gönderilemedi (SMTP reddi veya ağ). Alıcı UserId={UserId}, To={To}", dto.AssignedUserId, to);
            }
        }

        private static bool IsExpenseReminderMirrorType(string? type)
        {
            if (string.IsNullOrEmpty(type)) return false;
            return string.Equals(type, NotificationTypeKeys.ExpenseReminder, StringComparison.OrdinalIgnoreCase)
                   || string.Equals(type, NotificationTypeKeys.ExpenseReminderAdminQueue, StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>Admin veya worker: masraf onay kuyruğu (expensereminder_admin) bildirimleri listelenir; user rolü için sunucu tarafında gizlenir.</summary>
        private static bool CanSeeExpenseWorkflowNotifications(string? roleName)
        {
            if (string.IsNullOrEmpty(roleName)) return false;
            return string.Equals(roleName, RoleNames.Admin, StringComparison.OrdinalIgnoreCase)
                   || string.Equals(roleName, RoleNames.Worker, StringComparison.OrdinalIgnoreCase);
        }

        [LoggerAspect]
        [SecuredOperation(PortalNotificationRoles)]
        [ValidationAspect(typeof(MarkAsReadNotificationValidator))]
        public IResult MarkAsRead(long notificationId)
        {
            var notification = _notificationDal.Get(p => p.Id.Equals(notificationId));
            notification.IsChecked = true;
            _notificationDal.Update(notification);
            return new SuccessResult(NotificationMessages.NotificationMarkedAsRead);
        }

        [LoggerAspect]
        [SecuredOperation(PortalNotificationRoles)]
        [ValidationAspect(typeof(DeleteNotificationValidator))]
        public IResult Delete(long id)
        {
            var notification = _notificationDal.Get(p => p.Id.Equals(id));
            _notificationDal.Delete(notification);
            return new SuccessResult(NotificationMessages.DeletedNotification);
        }

        [LoggerAspect]
        [SecuredOperation(PortalNotificationRoles)]
        public async Task<IResult> DeleteAllForCurrentUserAsync()
        {
            var deleted = await _notificationDal.DeleteAllByAssignedUserIdAsync(_userContext.UserId);
            return new SuccessResult(string.Format(NotificationMessages.DeletedAllNotificationsFormat, deleted));
        }

        [LoggerAspect]
        [SecuredOperation(PortalNotificationRoles)]
        [ValidationAspect(typeof(GetAllPaginatedNotificationValidator))]
        public async Task<IResult> GetAllPaginated(int pageNumber, int pageSize)
        {
            var hideExpenseAdminQueue = !CanSeeExpenseWorkflowNotifications(_userContext.RoleName);
            return await _notificationDal.GetAllPaginatedAsync(_userContext.UserId, pageNumber, pageSize, hideExpenseAdminQueue);
        }
    }
}