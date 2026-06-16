using Core.DataAccess;
using Entities.Concrete;
using Entities.DTOs.ProjectTeamDtos;

namespace DataAccess.Repository.ProjectTeamRepository
{
	public interface IProjectTeamDal : IEntityRepository<ProjectTeam>
	{
		bool CanUserAccessProjectTeam(long projectTeamId, long userId);
		List<GetAllProjectTeamDto> GetAllWithMembers();
		List<GetAllProjectTeamDto> GetAllByCustomerAndUserWithMembers(long customerId, long userId);
		List<GetAllProjectTeamDto> GetAllByProjectWithMembers(long projectId);
		GetProjectTeamDto GetById(long id);
	}
}
