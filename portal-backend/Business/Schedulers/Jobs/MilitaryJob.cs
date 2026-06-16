using Business.Repository.NotificationRepository;
using Business.Repository.RolesForUsersRepository;
using Core.Identity;
using DataAccess.Repository.UserProfileDetailRepository;
using Entities.DTOs.NotificationDtos;
using Entities.Enums;
using Quartz;

namespace Business.Schedulers.Jobs
{
    public class MilitaryJob : IJob
    {
        private readonly IUserProfileDetailDal _userProfileDetailDal;
        private readonly IRolesForUsersService _rolesForUsersService;
        private readonly INotificationService _notificationService;

        public MilitaryJob(IUserProfileDetailDal userProfileDetailDal, IRolesForUsersService rolesForUsersService, INotificationService notificationService)
        {
            _userProfileDetailDal = userProfileDetailDal;
            _rolesForUsersService = rolesForUsersService;
            _notificationService = notificationService;
        }

        public System.Threading.Tasks.Task Execute(IJobExecutionContext context)
        {
            var userlist = _userProfileDetailDal.GetAll(x =>
                x.Sex == "Erkek" &&
                x.MilitaryCase != null &&
                x.MilitaryCase.Equals("Tecil") &&
                x.MilitaryDate.HasValue &&
                (x.MilitaryDate.Value.Date - DateTime.Now.Date).Days == 90);

            if (userlist.Any())
            {
                var admins = _rolesForUsersService.GetAllRolesForUsersByRoleName(RoleNames.Admin).Data;
                if (admins.Any())
                {
                    admins.ForEach(admin =>
                    {
                        userlist.ForEach(user =>
                        {
                            AddNotificationDto addNotificationDto = new()
                            {
                                Title = "Askerlik Bildirimi",
                                Type = NotificationTypes.Military.ToString(),
                                AssignedUserId = admin.Id,
                                Content = $"{user.Name} {user.Surname} isimli kullanıcının askerlik tecil süresinin dolmasına 90 gün kaldı. Tecil tarihi: {user.MilitaryDate}",
                                // EKLENDİ: Yönetici tıklayınca o personelin profiline gitsin
                                ReferenceId = user.Id.ToString()
                            };
                            _notificationService.Add(addNotificationDto);
                        });
                    });
                }
            }

            return System.Threading.Tasks.Task.CompletedTask;
        }
    }
}