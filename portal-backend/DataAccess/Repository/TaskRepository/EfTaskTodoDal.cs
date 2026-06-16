using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;

namespace DataAccess.Repository.TaskRepository
{
    public class EfTaskTodoDal : EfEntityRepositoryBase<TaskTodo, PortalContext>, ITaskTodoDal
    {
    }
}
