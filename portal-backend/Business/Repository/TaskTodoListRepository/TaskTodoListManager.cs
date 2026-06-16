using AutoMapper;
using Business.BusinessAspects;
using Business.Repository.TaskTodoListRepository.Constants;
using Business.Repository.TaskTodoListRepository.Validations;
using Business.Repository.TaskTodoRepository;
using Core.Aspects.Autofac.Transaction;
using Core.Aspects.Autofac.Validation;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.TaskRepository;
using Entities.Concrete;
using Entities.DTOs.TaskDtos;
using Entities.DTOs.TaskTodoListDtos;
using Microsoft.IdentityModel.Tokens;

namespace Business.Repository.TaskTodoListRepository
{
	public class TaskTodoListManager : ITaskTodoListService
	{
		private readonly ITaskTodoListDal _taskTodoListDal;
		private readonly ITaskTodoService _taskTodoService;
		private readonly IMapper _mapper;

		public TaskTodoListManager(ITaskTodoListDal taskTodoListDal, ITaskTodoService taskTodoService, IMapper mapper)
		{
			_taskTodoListDal = taskTodoListDal;
			_taskTodoService = taskTodoService;
			_mapper = mapper;
		}

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
		[ValidationAspect(typeof(AddTaskTodoListValidator))]
		public IResult Add(AddTaskTodoListDto taskTodoList)
		{
			_taskTodoListDal.Add(_mapper.Map<TaskTodoList>(taskTodoList));
			return new SuccessResult(TaskTodoListMessages.TaskTodoListAdded);
		}

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
		[ValidationAspect(typeof(DeleteTaskTodoListValidator))]
		[TransactionScopeAspect]
		public IResult Delete(int id)
		{
			var result = _taskTodoListDal.Get(p => p.Id.Equals(id));
			var deletedTaskTodos = _taskTodoService.GetAllByTodoListId(id).Data;
			if (!deletedTaskTodos.IsNullOrEmpty())
				_taskTodoService.DeleteAll(deletedTaskTodos);

			_taskTodoListDal.Delete(result);
			return new SuccessResult(TaskTodoListMessages.TaskTodoListDeleted);
		}

		public IResult DeleteAll(List<TaskTodoList> taskTodoLists)
		{
			if (taskTodoLists.IsNullOrEmpty()) return new ErrorResult();

			foreach (var taskTodoList in taskTodoLists)
			{
				Delete(taskTodoList.Id);
			}
			return new SuccessResult();
		}

		public IDataResult<List<TaskTodoList>> GetAllByTaskId(int taskId)
		{
			var result = _taskTodoListDal.GetAll(p => p.TaskId.Equals(taskId));
			return new SuccessDataResult<List<TaskTodoList>>(result);
		}

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
		[ValidationAspect(typeof(GetAllTaskTodoListValidator))]
		public IDataResult<List<TaskTodoListDto>> GetAllWithTodoByTaskId(int taskId)
		{
			var result = _taskTodoListDal.GetAllWithTodoByTaskId(taskId);
			return new SuccessDataResult<List<TaskTodoListDto>>(result);
		}

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
		[ValidationAspect(typeof(UpdateTaskTodoListValidator))]
		public IResult Update(UpdateTaskTodoListDto taskTodoList)
		{
			var updatedTaskTodoList = _taskTodoListDal.Get(p => p.Id.Equals(taskTodoList.Id));
			updatedTaskTodoList.Title = taskTodoList.Title;
			_taskTodoListDal.Update(updatedTaskTodoList);
			return new SuccessResult(TaskTodoListMessages.TaskTodoListUpdated);
		}
	}
}
