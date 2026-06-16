using Core.DataAccess;
using Entities.DTOs.TaskDtos;

namespace DataAccess.Repository.TaskRepository
{
    public interface ITaskDal: IEntityRepository<Entities.Concrete.Task>
    {
        TaskViewDto GetTaskByTaskId(int taskId);
    }
}
