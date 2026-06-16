using Business.Repository.TaskListRepository.Constants;
using Core.Identity;
using Core.Utilities.Exceptions;
using DataAccess.Repository.BoardRepository;
using DataAccess.Repository.TaskListRepository;
using Entities.Concrete;
using FluentValidation;

namespace Business.Repository.TaskListRepository.Validations
{
	public class DeleteTaskListValidator : AbstractValidator<int>
	{
		private readonly ITaskListDal _taskListDal;
		private readonly IBoardDal _boardDal;
		private readonly IUserContext _userContext;
		private TaskList? _cachedTaskList;
		public DeleteTaskListValidator(ITaskListDal taskListDal, IUserContext userContext, IBoardDal boardDal)
		{
			_taskListDal = taskListDal;
			_userContext = userContext;
			_boardDal = boardDal;

			RuleFor(id => id)
				.Cascade(CascadeMode.Stop)
				.Must(TaskListExists).WithMessage(TaskListMessages.TaskListNotFound)
				.Must(UserHasAccess);
		}

		private bool TaskListExists(int taskListId)
		{
			_cachedTaskList = _taskListDal.Get(p => p.Id.Equals(taskListId));
			return _cachedTaskList != null;
		}

		private bool UserHasAccess(int taskListId)
		{
			if (_userContext.RoleName == RoleNames.Admin) return true;
			var taskList = _cachedTaskList ?? _taskListDal.Get(p => p.Id.Equals(taskListId));
			var access = _boardDal.CanUserAccessToBoard(taskList.BoardId, _userContext.UserId);
			if (access) return true;
			throw new ForbiddenAccessException();
		}
	}
}
