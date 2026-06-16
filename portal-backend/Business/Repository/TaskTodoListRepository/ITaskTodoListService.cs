using Core.Utilities.Results.Abstract;
using Entities.Concrete;
using Entities.DTOs.TaskDtos;
using Entities.DTOs.TaskTodoListDtos;

namespace Business.Repository.TaskTodoListRepository
{
	public interface ITaskTodoListService
	{
		IResult Add(AddTaskTodoListDto taskTodoList);
		IResult Delete(int id);
		IResult DeleteAll(List<TaskTodoList> taskTodoLists);
		IResult Update(UpdateTaskTodoListDto taskTodoList);
		IDataResult<List<TaskTodoList>> GetAllByTaskId(int taskId);
		IDataResult<List<TaskTodoListDto>> GetAllWithTodoByTaskId(int taskId);
	}
}
