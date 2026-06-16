using AutoMapper;
using Business.BusinessAspects;
using Business.Repository.NotificationRepository; // ✅ EKLENDİ
using Business.Repository.ProjectRepository.Constants;
using Business.Repository.ProjectRepository.Validations;
using Core.Aspects.Autofac.Validation;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.ProjectRepository;
using Entities.Concrete;
using Entities.DTOs.NotificationDtos; // ✅ EKLENDİ
using Entities.DTOs.ProjectDtos;
using Entities.Enums; // ✅ EKLENDİ

namespace Business.Repository.ProjectRepository
{
    public class ProjectManager : IProjectService
    {
        private readonly IProjectDal _projectDal;
        private readonly IUserContext _userContext;
        private readonly IMapper _mapper;
        
        // 🔥 Yeni Eklenen Bağımlılık
        private readonly INotificationService _notificationService;

        public ProjectManager(IProjectDal projectDal, IUserContext userContext, IMapper mapper, INotificationService notificationService)
        {
            _projectDal = projectDal;
            _userContext = userContext;
            _mapper = mapper;
            _notificationService = notificationService;
        }

        [LoggerAspect]
        [SecuredOperation(RoleNames.Admin)]
        [ValidationAspect(typeof(AddProjectValidator))]
        public IResult Add(AddProjectDto project)
        {
            _projectDal.Add(_mapper.Map<Project>(project));
            return new SuccessResult(ProjectMessages.AddedProject);
        }

        public IDataResult<List<Project>> GetAll()
        {
            var result = _projectDal.GetAll();
            return new SuccessDataResult<List<Project>>(result);
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        public IDataResult<List<BasicProjectDto>> GetAllAsBasic()
        {
            List<BasicProjectDto> projects = _userContext.RoleName.Equals(RoleNames.User)
                ? _projectDal.GetAllAsBasicByCustomerAndUser(_userContext.CustomerId, _userContext.UserId)
                : _projectDal.GetAllAsBasic();
            return new SuccessDataResult<List<BasicProjectDto>>(projects);
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        public IDataResult<List<GetAllProjectDto>> GetAllAsDto()
        {
            List<GetAllProjectDto> projects = _userContext.RoleName.Equals(RoleNames.User)
                ? _projectDal.GetAllByCustomerAndUser(_userContext.CustomerId, _userContext.UserId)
                : _projectDal.GetAllAsDto();
            return new SuccessDataResult<List<GetAllProjectDto>>(projects);
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        [ValidationAspect(typeof(GetByIdProjectValidator))]
        public IDataResult<GetProjectDto> GetById(long id)
        {
            var result = _projectDal.GetById(id);
            return new SuccessDataResult<GetProjectDto>(result, ProjectMessages.ProjectListed);
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        public IDataResult<List<BasicProjectDto>> GetLeaderProjectsByUser()
        {
            List<BasicProjectDto> projects = _userContext.RoleName.Equals(RoleNames.User)
                ? _projectDal.GetLeaderProjectsByUser(_userContext.UserId)
                : _projectDal.GetAllAsBasic();
            return new SuccessDataResult<List<BasicProjectDto>>(projects);
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        [ValidationAspect(typeof(UpdateProjectValidator))]
        public IResult Update(UpdateProjectDto project)
        {
            _projectDal.Update(_mapper.Map<Project>(project));

            // --- 🔥 BİLDİRİM: PROJE GÜNCELLENDİ 🔥 ---
            // Proje detayları değiştiğinde ekibe haber verelim
            try
            {
                AddNotificationDto addNotificationDto = new()
                {
                    Title = "Proje Güncellemesi",
                    Content = $"{project.ProjectName} projesinde güncellemeler yapıldı.",
                    Type = NotificationTypes.Project.ToString(),
                    ReferenceId = project.Id.ToString()
                };
                
                // Projedeki herkese (User tablosundan çekerek) gönder
                _notificationService.SendAllByProjecjtId(addNotificationDto, project.Id);
            }
            catch { /* Bildirim hatası update işlemini bozmasın */ }
            // ------------------------------------------

            return new SuccessResult(ProjectMessages.UpdatedProject);
        }
    }
}