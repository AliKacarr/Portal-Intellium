using Business.Repository.TaskListRepository.Constants;
using Core.Identity;
using Core.Utilities.Exceptions;
using DataAccess.Repository.BoardRepository;
using DataAccess.Repository.TaskListRepository;
using Entities.Concrete;
using Entities.DTOs.TaskListDtos;
using FluentValidation;

namespace Business.Repository.TaskListRepository.Validations
{
	public class UpdateTaskListValidator : AbstractValidator<UpdateTaskListDto>
	{
		private readonly ITaskListDal _taskListDal;
		private readonly IBoardDal _boardDal;
		private readonly IUserContext _userContext;
		private TaskList? _cachedTaskList;
		public UpdateTaskListValidator(ITaskListDal taskListDal, IBoardDal boardDal, IUserContext userContext)
		{
			_taskListDal = taskListDal;
			_boardDal = boardDal;
			_userContext = userContext;

			RuleFor(taskList => taskList.Id)
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
			var taskList = _cachedTaskList ?? _taskListDal.Get(tl => tl.Id == taskListId);
			var access = _boardDal.CanUserAccessToBoard(taskList.BoardId, _userContext.UserId);
			if (access) return true;
			throw new ForbiddenAccessException();
		}
	}
}
