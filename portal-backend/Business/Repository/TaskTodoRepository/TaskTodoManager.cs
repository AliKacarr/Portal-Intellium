using AutoMapper;
using Business.BusinessAspects;
using Business.Repository.TaskTodoRepository.Constants;
using Business.Repository.TaskTodoRepository.Validations;
using Core.Aspects.Autofac.Validation;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.TaskRepository;
using Entities.Concrete;
using Entities.DTOs.TaskTodoDtos;
using Microsoft.IdentityModel.Tokens;

namespace Business.Repository.TaskTodoRepository
{
	public class TaskTodoManager : ITaskTodoService
	{
		private readonly ITaskTodoDal _taskTodoDal;
		private readonly IMapper _mapper;
		private readonly IUserContext _userContext;

		public TaskTodoManager(ITaskTodoDal taskTodoDal, IMapper mapper, IUserContext userContext)
		{
			_taskTodoDal = taskTodoDal;
			_mapper = mapper;
			_userContext = userContext;
		}

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
		[ValidationAspect(typeof(AddTaskTodoValidator))]
		public IResult Add(AddTaskTodoDto taskTodo)
		{
			_taskTodoDal.Add(_mapper.Map<TaskTodo>(taskTodo));
			return new SuccessResult(TaskTodoMessages.TaskTodoAdded);
		}

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
		[ValidationAspect(typeof(ChangeTaskTodoValidator))]
		public IResult Change(int id, bool state)
		{
			var result = _taskTodoDal.Get(p => p.Id.Equals(id));
			result.CompletedByUserId = state ? _userContext.UserId : null;
			result.CompletedDate = state ? DateTime.Now : null;
			result.State = state;
			_taskTodoDal.Update(result);
			return new SuccessResult(TaskTodoMessages.TaskTodoUpdated);
		}

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
		[ValidationAspect(typeof(DeleteTaskTodoValidator))]
		public IResult Delete(int id)
		{
			var result = _taskTodoDal.Get(p => p.Id.Equals(id));
			_taskTodoDal.Delete(result);
			return new SuccessResult(TaskTodoMessages.TaskTodoDeleted);
		}

		public IResult DeleteAll(List<TaskTodo> taskTodos)
		{
			if (taskTodos.IsNullOrEmpty()) return new ErrorResult();
			foreach (var taskTodo in taskTodos)
			{
				Delete(taskTodo.Id);
			}
			return new SuccessResult();
		}

		public IDataResult<List<TaskTodo>> GetAllByTodoListId(int todoListId)
		{
			var result = _taskTodoDal.GetAll(p => p.TaskTodoListId.Equals(todoListId));
			return new SuccessDataResult<List<TaskTodo>>(result);
		}

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
		[ValidationAspect(typeof(UpdateTaskTodoValidator))]
		public IResult Update(UpdateTaskTodoDto taskTodo)
		{
			var updatedTaskTodo = _taskTodoDal.Get(p => p.Id.Equals(taskTodo.Id));
			updatedTaskTodo.Content = taskTodo.Content;
			_taskTodoDal.Update(updatedTaskTodo);
			return new SuccessResult(TaskTodoMessages.TaskTodoUpdated);
		}
	}
}
