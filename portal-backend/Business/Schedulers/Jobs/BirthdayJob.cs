using Business.Repository.NotificationRepository;
using DataAccess.Repository.UserProfileDetailRepository;
using Entities.DTOs.NotificationDtos;
using Entities.Enums;
using Quartz;

namespace Business.Schedulers.Jobs
{
    public class BirthdayJob : IJob
    {
        private readonly IUserProfileDetailDal _userProfileDetailDal;
        private readonly INotificationService _notificationService;
        public BirthdayJob(INotificationService notificationService, IUserProfileDetailDal userProfileDetailDal)
        {
            _notificationService = notificationService;
            _userProfileDetailDal = userProfileDetailDal;
        }

        public System.Threading.Tasks.Task Execute(IJobExecutionContext context)
        {
            var userlist = _userProfileDetailDal.GetAll(x => x.BirthDate.Month == DateTime.Now.Month && x.BirthDate.Day == DateTime.Now.Day);
            if (userlist.Any())
            {
                foreach (var user in userlist)
                {
                    AddNotificationDto notification = new()
                    {
                        AssignedUserId = user.Id,
                        Title = "Doğum Gününüz Kutlu Olsun",
                        Content = "Doğum gününüzü kutlar, sağlıklı ve mutlu nice yıllar dileriz.",
                        Type = NotificationTypes.Birthday.ToString(),
                        // EKLENDİ: Kullanıcı bildirime tıklayınca kendi profiline gitsin
                        ReferenceId = user.Id.ToString()
                    };
                    _notificationService.Add(notification);
                }
            }

            return System.Threading.Tasks.Task.CompletedTask;
        }
    }
}