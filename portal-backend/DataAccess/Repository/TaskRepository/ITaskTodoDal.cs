using Core.DataAccess;
using Entities.Concrete;

namespace DataAccess.Repository.TaskRepository
{
    public interface ITaskTodoDal : IEntityRepository<TaskTodo>
    {
    }
}
