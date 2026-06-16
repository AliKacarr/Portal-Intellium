using Business.Repository.NotificationRepository;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.ProjectRepository;
using DataAccess.Repository.ProjectTeamMemberRepository;
using DataAccess.Repository.ProjectTeamRepository;
using Entities.Concrete;
using Entities.DTOs.NotificationDtos;
using Entities.DTOs.ProjectTeamDtos;
using Entities.Enums;

namespace Business.Repository.ProjectTeamMemberRepository
{
    public class ProjectTeamMemberManager : IProjectTeamMemberService
    {
        private readonly IProjectDal _projectDal;
        private readonly IProjectTeamDal _projectTeamDal;
        private readonly IProjectTeamMemberDal _projectTeamMemberDal;
        private readonly INotificationService _notificationService;

        public ProjectTeamMemberManager(IProjectTeamMemberDal projectTeamMemberDal, INotificationService notificationService, IProjectDal projectDal, IProjectTeamDal projectTeamDal)
        {
            _projectDal = projectDal;
            _projectTeamDal = projectTeamDal;
            _projectTeamMemberDal = projectTeamMemberDal;
            _notificationService = notificationService;
        }

        public IResult Add(List<AddProjectTeamMemberDto> users, long projectTeamId)
        {
            foreach (var user in users)
            {
                var result = _projectTeamMemberDal.Get(member => member.UserId.Equals(user.Id) && member.ProjectTeamId.Equals(projectTeamId));
                if (result == null)
                {
                    ProjectTeamMember teamMember = new()
                    {
                        UserId = user.Id,
                        ProjectTeamId = projectTeamId,
                        ProjectRole = user.ProjectRole
                    };
                    _projectTeamMemberDal.Add(teamMember);

                    var projectTeam = _projectTeamDal.Get(p => p.Id.Equals(projectTeamId));
                    var projectName = _projectDal.Get(p => p.Id.Equals(projectTeam.ProjectId)).ProjectName;
                    
                    AddNotificationDto addNotificationDto = new()
                    {
                        AssignedUserId = user.Id,
                        Content = string.Format("{0} isimli projeye ekip üyesi olarak atandınız.", projectName),
                        Title = "Yeni Ekip Üyesi",
                        Type = NotificationTypes.Project.ToString(),
                        // EKLENDİ: Proje ID'sini referans olarak veriyoruz
                        ReferenceId = projectTeam.ProjectId.ToString()
                    };

                    _notificationService.Add(addNotificationDto);
                }
            }
            return new SuccessResult();
        }

        public IResult DeleteAllByProjectTeam(long projectTeamId)
        {
            var members = _projectTeamMemberDal.GetAll(m => m.ProjectTeamId.Equals(projectTeamId));
            if (members == null) return new ErrorResult();
            foreach (var member in members)
            {
                _projectTeamMemberDal.Delete(member);
            }
            return new SuccessResult();
        }

        public IResult DeleteMembers(List<long> userIds, long projectTeamId)
        {
            foreach (long userId in userIds)
            {
                var result = _projectTeamMemberDal.Get(member => member.UserId.Equals(userId) && member.ProjectTeamId.Equals(projectTeamId));
                if (result == null) continue;
                _projectTeamMemberDal.Delete(result);
            }
            return new SuccessResult();
        }

        public IDataResult<List<ProjectTeamMember>> GetAllByProject(long projectId)
        {
            var teams = _projectTeamDal.GetAll(t => t.ProjectId == projectId);
            if (!teams.Any()) return new ErrorDataResult<List<ProjectTeamMember>>("Bu projeye ait bir ekip bulunamadı");

            List<ProjectTeamMember> teamMembers = new();
            foreach (var team in teams)
            {
                var members = _projectTeamMemberDal.GetAll(m => m.ProjectTeamId == team.Id);
                if (members.Any())
                {
                    teamMembers.AddRange(members);
                }
            }
            return new SuccessDataResult<List<ProjectTeamMember>>(teamMembers);
        }

        public IDataResult<List<ProjectTeamMember>> GetAllByProjectTeam(long projectTeamId)
        {
            var result = _projectTeamMemberDal.GetAll(member => member.ProjectTeamId.Equals(projectTeamId));

            if (!result.Any())
                return new ErrorDataResult<List<ProjectTeamMember>>("Bu takıma bağlı kişiler bulunamadı");

            return new SuccessDataResult<List<ProjectTeamMember>>(result);
        }
    }
}