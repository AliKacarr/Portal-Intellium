using Business.Repository.NotificationRepository;
using Business.Repository.RolesForUsersRepository;
using Business.Repository.UserRepository;
using Core.Identity;
using DataAccess.Repository.HealthInfoRepository;
using Entities.Concrete;
using Entities.DTOs.NotificationDtos;
using Entities.Enums;
using Quartz;

namespace Business.Schedulers.Jobs
{
    public class InsuranceJob : IJob
    {
        private readonly IHealthInfoDal _healthInfoDal;
        private readonly IRolesForUsersService _rolesForUsersService;
        private readonly INotificationService _notificationService;
        private readonly IUserService _userService;

        public InsuranceJob(IHealthInfoDal healthInfoDal, IRolesForUsersService rolesForUsersService, INotificationService notificationService, IUserService userService)
        {
            _healthInfoDal = healthInfoDal;
            _rolesForUsersService = rolesForUsersService;
            _notificationService = notificationService;
            _userService = userService;
        }

        public System.Threading.Tasks.Task Execute(IJobExecutionContext context)
        {
            var today = DateTime.Now.Date;
            var healtinfos = _healthInfoDal.GetAll(x => (x.InsuranceEndDate.Date - today).Days == 30);

            if (healtinfos.Any())
            {
                var admins = _rolesForUsersService.GetAllRolesForUsersByRoleName(RoleNames.Admin).Data;
                if (admins.Any())
                {
                    List<User> users = new();
                    
                    // İlgili kullanıcıları topla
                    healtinfos.ForEach(infos => users.Add(_userService.GetById(infos.UserId).Data));
                    
                    admins.ForEach(admin =>
                    {
                        users.ForEach(user =>
                        {
                            AddNotificationDto addNotificationDto = new()
                            {
                                Title = "Poliçe Bildirimi",
                                Type = NotificationTypes.Insurance.ToString(),
                                AssignedUserId = admin.Id,
                                Content = $"{user.Name} isimli kullanıcının poliçe süresinin bitmesine 30 gün kaldı",
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