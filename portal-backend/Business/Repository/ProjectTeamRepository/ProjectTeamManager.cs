using AutoMapper;
using Business.BusinessAspects;
using Business.Repository.ProjectTeamMemberRepository;
using Business.Repository.ProjectTeamRepository.Constants;
using Business.Repository.ProjectTeamRepository.Validations;
using Core.Aspects.Autofac.Validation;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.ProjectTeamRepository;
using Entities.Concrete;
using Entities.DTOs.ProjectTeamDtos;

namespace Business.Repository.ProjectTeamRepository
{
	public class ProjectTeamManager : IProjectTeamService
	{
		private readonly IProjectTeamDal _projectTeamDal;
		private readonly IProjectTeamMemberService _projectTeamMemberService;
		private readonly IUserContext _userContext;
		private readonly IMapper _mapper;
		public ProjectTeamManager(IProjectTeamDal projectTeamDal, IProjectTeamMemberService projectTeamMemberService, IUserContext userContext, IMapper mapper)
		{
			_projectTeamDal = projectTeamDal;
			_projectTeamMemberService = projectTeamMemberService;
			_userContext = userContext;
			_mapper = mapper;
		}

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
		[ValidationAspect(typeof(AddProjectTeamValidator))]
		public IResult Add(AddProjectTeamDto addProjectTeam)
		{
			ProjectTeam projectTeam = _mapper.Map<ProjectTeam>(addProjectTeam);
			_projectTeamDal.Add(projectTeam);

			if (addProjectTeam.AddedUsers != null) _projectTeamMemberService.Add(addProjectTeam.AddedUsers, projectTeam.Id);
			return new SuccessResult(ProjectTeamMessages.ProjectTeamAdded);

		}

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
		[ValidationAspect(typeof(DeleteProjectTeamValidator))]
		public IResult Delete(long teamId)
		{
			var result = _projectTeamDal.Get(team => team.Id.Equals(teamId));
			_projectTeamMemberService.DeleteAllByProjectTeam(teamId);
			_projectTeamDal.Delete(result);
			return new SuccessResult(ProjectTeamMessages.ProjectTeamDeleted);
		}

		public IResult DeleteAllByProject(long projectId)
		{
			var result = _projectTeamDal.GetAll(pt => pt.ProjectId.Equals(projectId));
			if (result == null)
				return new ErrorResult();

			foreach (var projectTeam in result)
			{
				_projectTeamMemberService.DeleteAllByProjectTeam(projectTeam.Id);
				_projectTeamDal.Delete(projectTeam);
			}
			return new SuccessResult();

		}

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
		public IDataResult<List<GetAllProjectTeamDto>> GetAll()
		{
			List<GetAllProjectTeamDto> projectTeams = _userContext.RoleName.Equals(RoleNames.User) ?
				 _projectTeamDal.GetAllByCustomerAndUserWithMembers(_userContext.CustomerId, _userContext.UserId) :
				 _projectTeamDal.GetAllWithMembers();
			return new SuccessDataResult<List<GetAllProjectTeamDto>>(projectTeams);
		}

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
		public IDataResult<List<GetAllProjectTeamDto>> GetAllByProject(long projectId)
		{
			var result = _projectTeamDal.GetAllByProjectWithMembers(projectId);
			return new SuccessDataResult<List<GetAllProjectTeamDto>>(result);
		}

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
		[ValidationAspect(typeof(GetByIdProjectTeamValidator))]
		public IDataResult<GetProjectTeamDto> GetById(long id)
		{
			var result = _projectTeamDal.GetById(id);
			return new SuccessDataResult<GetProjectTeamDto>(result);
		}

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
		[ValidationAspect(typeof(UpdateProjectTeamValidator))]
		public IResult Update(EditProjectTeamDto editProjectTeam)
		{
			var result = _projectTeamDal.Get(p => p.Id.Equals(editProjectTeam.Id));

			_mapper.Map(editProjectTeam, result);

			if (editProjectTeam.RemoveUserIds != null)
				_projectTeamMemberService.DeleteMembers(editProjectTeam.RemoveUserIds, result.Id);

			if (editProjectTeam.AddUserIds != null)
				_projectTeamMemberService.Add(editProjectTeam.AddUserIds, result.Id);

			_projectTeamDal.Update(result);

			return new SuccessResult(ProjectTeamMessages.ProjectTeamUpdated);
		}
	}
}
