using Core.DataAccess;
using Entities.Concrete;
using Entities.DTOs.TaskDtos;

namespace DataAccess.Repository.TaskRepository
{
    public interface ITaskTodoListDal : IEntityRepository<TaskTodoList>
    {
        List<TaskTodoListDto> GetAllWithTodoByTaskId(int taskId);
    }
}
