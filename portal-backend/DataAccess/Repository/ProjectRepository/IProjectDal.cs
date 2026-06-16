using Core.DataAccess;
using Entities.Concrete;
using Entities.DTOs.ProjectDtos;

namespace DataAccess.Repository.ProjectRepository
{
    public interface IProjectDal : IEntityRepository<Project>
    {
        bool CanUserAccessProject(long projectId, long customerId, long userId);
        List<GetAllProjectDto> GetAllByCustomerAndUser(long customerId, long userId);
        List<GetAllProjectDto> GetAllAsDto();
        List<BasicProjectDto> GetAllAsBasicByCustomerAndUser(long customerId, long userId);
        List<BasicProjectDto> GetAllAsBasic();
        GetProjectDto GetById(long projectId);
        List<BasicProjectDto> GetLeaderProjectsByUser(long userId);

	}
}
