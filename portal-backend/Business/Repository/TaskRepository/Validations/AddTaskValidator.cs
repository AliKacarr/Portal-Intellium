using Business.Repository.TaskListRepository.Constants;
using Core.Identity;
using Core.Utilities.Exceptions;
using DataAccess.Repository.BoardRepository;
using DataAccess.Repository.TaskListRepository;
using Entities.Concrete;
using Entities.DTOs.TaskDtos;
using FluentValidation;

namespace Business.Repository.TaskRepository.Validations
{
	public class AddTaskValidator : AbstractValidator<AddTaskDto>
	{
		private readonly ITaskListDal _taskListDal;
		private readonly IBoardDal _boardDal;
		private readonly IUserContext _userContext;
		private TaskList? _cachedTaskList;
		public AddTaskValidator(ITaskListDal taskListDal, IBoardDal boardDal, IUserContext userContext)
		{
			_taskListDal = taskListDal;
			_boardDal = boardDal;
			_userContext = userContext;

			RuleFor(addTask => addTask.Task.TaskListId)
				.Cascade(CascadeMode.Stop)
				.Must(TaskListExists).WithMessage(TaskListMessages.TaskListNotFound)
				.Must(UserHasAccess);
		}

		private bool TaskListExists(int id)
		{
			_cachedTaskList = _taskListDal.Get(p => p.Id.Equals(id));
			return _cachedTaskList != null;
		}

		private bool UserHasAccess(int taskListId)
		{
			if (_userContext.RoleName == RoleNames.Admin) return true;
			var taskList = _cachedTaskList ?? _taskListDal.Get(tl => tl.Id == taskListId);
			var access = _boardDal.CanUserAccessToBoard(taskList.BoardId, _userContext.UserId);
			if (access) return true;
			throw new ForbiddenAccessException();
		}
	}
}
