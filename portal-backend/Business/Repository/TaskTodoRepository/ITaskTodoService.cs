using Core.Utilities.Results.Abstract;
using Entities.Concrete;
using Entities.DTOs.TaskTodoDtos;

namespace Business.Repository.TaskTodoRepository
{
    public interface ITaskTodoService
    {
        IResult Add(AddTaskTodoDto taskTodo);
        IResult Delete(int id);
        IResult Update(UpdateTaskTodoDto taskTodo);
        IResult Change(int id, bool state);
        IResult DeleteAll(List<TaskTodo> taskTodos);
        IDataResult<List<TaskTodo>> GetAllByTodoListId(int todoListId);
    }
}
