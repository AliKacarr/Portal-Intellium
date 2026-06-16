using Business.Repository.TaskListRepository;
using Entities.DTOs.TaskDtos;
using Entities.DTOs.TaskListDtos;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class TaskListsController : ControllerBase
	{
		private readonly ITaskListService _taskListService;

		public TaskListsController(ITaskListService taskListService)
		{
			_taskListService = taskListService;
		}

		[HttpPost("add")]
		public IActionResult Add([FromBody] AddTaskListDto addTaskList)
		{
			var result = _taskListService.Add(addTaskList);
			return (result.Success) ? Ok(result) : BadRequest(result);
		}

		[HttpDelete("delete")]
		public IActionResult Delete(int taskListId)
		{
			var result = _taskListService.Delete(taskListId);
			return (result.Success) ? Ok(result) : BadRequest(result);
		}

		[HttpPut("update")]
		public IActionResult Update([FromBody] UpdateTaskListDto updateTaskList)
		{
			var result = _taskListService.Update(updateTaskList);
			return (result.Success) ? Ok(result) : BadRequest(result);
		}

		[HttpPut("updateorder")]
		public IActionResult UpdateOrder([FromBody] List<TaskListOrderEditDto> taskLists)
		{
			var result = _taskListService.UpdateOrder(taskLists);
			return (result.Success) ? Ok(result) : BadRequest(result);
		}

		[HttpGet("getallwithtasks")]
		public IActionResult GetAllWithTasks(int boardId)
		{
			var result = _taskListService.GetAllWithTasks(boardId);
			return Ok(result);
		}
	}
}
