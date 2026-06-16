using Core.DataAccess;
using Entities.Concrete;
using Entities.DTOs.TaskListDtos;

namespace DataAccess.Repository.TaskListRepository
{
    public interface ITaskListDal : IEntityRepository<TaskList>
    {
        List<TaskListDto> GetAllWithTasks(int boardId);
    }
}
