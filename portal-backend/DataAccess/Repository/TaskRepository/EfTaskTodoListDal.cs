using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;
using Entities.DTOs.TaskDtos;

namespace DataAccess.Repository.TaskRepository
{
    public class EfTaskTodoListDal : EfEntityRepositoryBase<TaskTodoList, PortalContext>, ITaskTodoListDal
    {
        public List<TaskTodoListDto> GetAllWithTodoByTaskId(int taskId)
        {
            using (var context = new PortalContext())
            {
                var result = (from taskTodoList in context.TaskTodoLists
                              where taskTodoList.TaskId == taskId
                              select new TaskTodoListDto
                              {
                                  Id = taskTodoList.Id,
                                  Title = taskTodoList.Title,
                                  TaskTodos = context.TaskTodos.Where(taskTodo => taskTodo.TaskTodoListId == taskTodoList.Id)
                                  .OrderBy(taskTodo => taskTodo.Id).ToList()
                              }).ToList();
                return result;
            }
        }
    }
}
