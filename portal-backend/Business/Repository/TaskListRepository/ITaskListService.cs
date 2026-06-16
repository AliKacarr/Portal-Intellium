using Core.Utilities.Results.Abstract;
using Entities.Concrete;
using Entities.DTOs.TaskDtos;
using Entities.DTOs.TaskListDtos;

namespace Business.Repository.TaskListRepository
{
	public interface ITaskListService
	{
		IResult Add(AddTaskListDto addTaskList);
		IResult Delete(int taskListId);
		IResult DeleteAll(List<TaskList> taskLists);
		IResult Update(UpdateTaskListDto updateTaskList);
		IResult UpdateOrder(List<TaskListOrderEditDto> taskLists);
		IDataResult<List<TaskList>> GetAllByBoardId(int boardId);
		IDataResult<List<TaskListDto>> GetAllWithTasks(int boardId);

	}
}
