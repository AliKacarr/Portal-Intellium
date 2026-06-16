using Core.Utilities.Results.Abstract;
using Entities.Concrete;
using Entities.DTOs.ProjectDtos;

namespace Business.Repository.ProjectRepository
{
    public interface IProjectService
    {
        IResult Add(AddProjectDto project);
        IResult Update(UpdateProjectDto project);
        IDataResult<List<GetAllProjectDto>> GetAllAsDto();
        IDataResult<List<Project>> GetAll();
        IDataResult<List<BasicProjectDto>> GetAllAsBasic();
        IDataResult<GetProjectDto> GetById(long id);
        IDataResult<List<BasicProjectDto>> GetLeaderProjectsByUser();

	}
}
