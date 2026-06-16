using AutoMapper;
using Business.BusinessAspects;
using Business.Repository.TaskListRepository.Constants;
using Business.Repository.TaskListRepository.Validations;
using Business.Repository.TaskRepository;
using Core.Aspects.Autofac.Validation;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.TaskListRepository;
using Entities.Concrete;
using Entities.DTOs.TaskDtos;
using Entities.DTOs.TaskListDtos;
using Microsoft.IdentityModel.Tokens;

namespace Business.Repository.TaskListRepository
{
	public class TaskListManager : ITaskListService
	{
		private readonly ITaskListDal _taskListDal;
		private readonly ITaskService _taskService;
		private readonly IMapper _mapper;

		public TaskListManager(ITaskListDal taskListDal, ITaskService taskService, IMapper mapper)
		{
			_taskListDal = taskListDal;
			_taskService = taskService;
			_mapper = mapper;
		}

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
		[ValidationAspect(typeof(AddTaskListValidator))]
		public IResult Add(AddTaskListDto addTaskList)
		{
			var result = _taskListDal.GetAll(p => p.BoardId.Equals(addTaskList.BoardId)).OrderByDescending(p => p.OrderNo).FirstOrDefault();
			addTaskList.OrderNo = (result != null) ? result.OrderNo + 1 : 1;
			_taskListDal.Add(_mapper.Map<TaskList>(addTaskList));
			return new SuccessResult(TaskListMessages.TaskListAdded);
		}

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
		[ValidationAspect(typeof(DeleteTaskListValidator))]
		public IResult Delete(int taskListId)
		{
			var removedTaskList = _taskListDal.Get(p => p.Id.Equals(taskListId));
			var removedTasks = _taskService.GetAllByTaskListId(taskListId).Data;

			if (removedTasks != null)
			{
				_taskService.DeleteAll(removedTasks);
			}

			_taskListDal.Delete(removedTaskList);
			return new SuccessResult(TaskListMessages.TaskListDeleted);
		}

		public IResult DeleteAll(List<TaskList> taskLists)
		{
			if (taskLists.IsNullOrEmpty()) return new ErrorResult();
			foreach (var taskList in taskLists)
			{
				Delete(taskList.Id);
			}
			return new SuccessResult();
		}

		public IDataResult<List<TaskList>> GetAllByBoardId(int boardId)
		{
			var result = _taskListDal.GetAll(p => p.BoardId.Equals(boardId));
			return (!result.IsNullOrEmpty()) ? new SuccessDataResult<List<TaskList>>(result)
				: new ErrorDataResult<List<TaskList>>();
		}

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
		[ValidationAspect(typeof(GetAllTaskListValidator))]
		public IDataResult<List<TaskListDto>> GetAllWithTasks(int boardId)
		{
			var result = _taskListDal.GetAllWithTasks(boardId);
			return (!result.IsNullOrEmpty())
				? new SuccessDataResult<List<TaskListDto>>(result)
				: new ErrorDataResult<List<TaskListDto>>(TaskListMessages.BoardHasNoTaskList);
		}

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
		[ValidationAspect(typeof(UpdateTaskListValidator))]
		public IResult Update(UpdateTaskListDto updateTaskList)
		{
			var result = _taskListDal.Get(p => p.Id.Equals(updateTaskList.Id));
			result.Name = updateTaskList.Name;
			_taskListDal.Update(result);
			return new SuccessResult(TaskListMessages.TaskListUpdated);
		}

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
		[ValidationAspect(typeof(UpdateOrderTaskListValidator))]
		public IResult UpdateOrder(List<TaskListOrderEditDto> taskLists)
		{
			foreach (var taskList in taskLists)
			{
				var result = _taskListDal.Get(p => p.Id.Equals(taskList.Id));
				result.OrderNo = taskList.OrderNo;
				_taskListDal.Update(result);
			}
			return new SuccessResult();
		}
	}
}
