using Business.Repository.BoardRepository.Constants;
using Business.Repository.TaskTodoListRepository.Constants;
using Core.Identity;
using Core.Utilities.Exceptions;
using DataAccess.Repository.BoardRepository;
using DataAccess.Repository.TaskRepository;
using Entities.Concrete;
using Entities.DTOs.TaskTodoListDtos;
using FluentValidation;

namespace Business.Repository.TaskTodoListRepository.Validations
{
	public class UpdateTaskTodoListValidator : AbstractValidator<UpdateTaskTodoListDto>
	{
		private readonly IBoardDal _boardDal;
		private readonly IUserContext _userContext;
		private readonly ITaskTodoListDal _taskTodoListDal;
		private TaskTodoList? _cachedTaskTodoList;

		public UpdateTaskTodoListValidator(IBoardDal boardDal, IUserContext userContext, ITaskTodoListDal taskTodoListDal)
		{
			_boardDal = boardDal;
			_userContext = userContext;
			_taskTodoListDal = taskTodoListDal;

			RuleFor(taskTodoList => taskTodoList.Id)
				.Cascade(CascadeMode.Stop)
				.Must(TaskTodoListExists)
					.WithMessage(TaskTodoListMessages.TaskTodoListNotFound)
				.Must(UserHasAccess);
		}

		private bool TaskTodoListExists(int taskTodoListId)
		{
			_cachedTaskTodoList = _taskTodoListDal.Get(p => p.Id == taskTodoListId);
			return _cachedTaskTodoList != null;
		}

		private bool UserHasAccess(int taskTodoListId)
		{
			if (_userContext.RoleName == RoleNames.Admin) return true;
			var taskTodoList = _cachedTaskTodoList ?? _taskTodoListDal.Get(p => p.Id == taskTodoListId);
			var board = _boardDal.GetBoardByTaskId(taskTodoList.TaskId) ?? throw new BadRequestException(BoardMessages.BoardNotFound);
			var hasAccess = _boardDal.CanUserAccessToBoard(board.Id, _userContext.UserId);
			if (!hasAccess) throw new ForbiddenAccessException();
			return true;
		}
	}
}
