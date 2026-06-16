using Business.Repository.NotificationRepository;
using DataAccess.Repository.ProjectRepository;
using Entities.DTOs.NotificationDtos;
using Entities.Enums;
using Quartz;

namespace Business.Schedulers.Jobs
{
    public class ProjectTimeJob : IJob
    {
        private readonly IProjectDal _projectDal;
        private readonly INotificationService _notificationService;

        public ProjectTimeJob(INotificationService notificationService, IProjectDal projectDal)
        {
            _notificationService = notificationService;
            _projectDal = projectDal;
        }

        public Task Execute(IJobExecutionContext context)
        {
            var projects = _projectDal.GetAll(project => (project.FinishDate.Date - DateTime.Now.Date).Days == 30);

            if (projects.Any())
            {
                foreach (var project in projects)
                {
                    AddNotificationDto addNotificationDto = new()
                    {
                        Title = "Proje Süresi Bildirimi",
                        Type = NotificationTypes.Project.ToString(),
                        AssignedUserId = project.LeaderUserId,
                        Content = $"{project.ProjectName} isimli projenin bitiş süresine 30 gün kaldı",
                        // EKLENDİ: Proje lideri tıklayınca proje detayına gitsin
                        ReferenceId = project.Id.ToString()
                    };
                    _notificationService.Add(addNotificationDto);
                }
            }

            return Task.CompletedTask;
        }
    }
}