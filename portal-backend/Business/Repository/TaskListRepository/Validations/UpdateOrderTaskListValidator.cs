using Business.Repository.TaskListRepository.Constants;
using Core.Identity;
using Core.Utilities.Exceptions;
using DataAccess.Repository.BoardRepository;
using DataAccess.Repository.TaskListRepository;
using Entities.Concrete;
using Entities.DTOs.TaskDtos;
using FluentValidation;

namespace Business.Repository.TaskListRepository.Validations
{
	public class UpdateOrderTaskListValidator : AbstractValidator<List<TaskListOrderEditDto>>
	{
		private readonly ITaskListDal _taskListDal;
		private readonly IBoardDal _boardDal;
		private readonly IUserContext _userContext;
		private TaskList? _cachedTaskList;

		public UpdateOrderTaskListValidator(ITaskListDal taskListDal, IBoardDal boardDal, IUserContext userContext)
		{
			_taskListDal = taskListDal;
			_boardDal = boardDal;
			_userContext = userContext;

			RuleForEach(taskList => taskList)
				.Cascade(CascadeMode.Stop)
				.Must(TaskListExists).WithMessage(TaskListMessages.TaskListNotFound)
				.Must(UserHasAccess)
				.DependentRules(() =>
				{
					RuleForEach(taskList => taskList)
						.Must(HasValidOrderNo).WithMessage(TaskListMessages.InvalidOrderNo);
				});
		}

		private bool TaskListExists(TaskListOrderEditDto taskList)
		{
			_cachedTaskList = _taskListDal.Get(p => p.Id == taskList.Id);
			return _cachedTaskList != null;
		}

		private bool HasValidOrderNo(TaskListOrderEditDto taskList)
		{
			return taskList.OrderNo >= 0;
		}

		private bool UserHasAccess(TaskListOrderEditDto taskListDto)
		{
			if (_userContext.RoleName == RoleNames.Admin) return true;
			var taskList = _cachedTaskList ?? _taskListDal.Get(tl => tl.Id == taskListDto.Id);
			var access = _boardDal.CanUserAccessToBoard(taskList.BoardId, _userContext.UserId);
			if (access) return true;
			throw new ForbiddenAccessException();
		}
	}
}
