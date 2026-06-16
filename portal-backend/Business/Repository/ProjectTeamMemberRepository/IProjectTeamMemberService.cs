using Core.Utilities.Results.Abstract;
using Entities.Concrete;
using Entities.DTOs.ProjectTeamDtos;

namespace Business.Repository.ProjectTeamMemberRepository
{
    public interface IProjectTeamMemberService
    {
        IResult Add(List<AddProjectTeamMemberDto> users, long projectTeamId);
        IResult DeleteMembers(List<long> userIds, long projectTeamId);
        IResult DeleteAllByProjectTeam(long projectTeamId);
        IDataResult<List<ProjectTeamMember>> GetAllByProjectTeam(long projectTeamId);
        IDataResult<List<ProjectTeamMember>> GetAllByProject(long projectId);

    }
}
