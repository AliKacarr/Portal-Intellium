using Business.Repository.BoardRepository.Constants;
using Business.Repository.TaskTodoListRepository.Constants;
using Core.Identity;
using Core.Utilities.Exceptions;
using DataAccess.Repository.BoardRepository;
using DataAccess.Repository.TaskRepository;
using Entities.Concrete;
using Entities.DTOs.TaskTodoDtos;
using FluentValidation;

namespace Business.Repository.TaskTodoRepository.Validations
{
	public class AddTaskTodoValidator : AbstractValidator<AddTaskTodoDto>
	{
		private readonly ITaskTodoListDal _taskTodoListDal;
		private readonly IUserContext _userContext;
		private readonly IBoardDal _boardDal;
		private TaskTodoList? _cachedTaskTodoList;
		public AddTaskTodoValidator(ITaskTodoListDal taskTodoListDal, IUserContext userContext, IBoardDal boardDal)
		{
			_taskTodoListDal = taskTodoListDal;
			_userContext = userContext;
			_boardDal = boardDal;

			RuleFor(taskTodo => taskTodo.TaskTodoListId)
				.Cascade(CascadeMode.Stop)
				.Must(TaskTodoListExists).WithMessage(TaskTodoListMessages.TaskTodoListNotFound)
				.Must(UserHasAccess);
		}

		private bool UserHasAccess(int taskTodoListId)
		{
			if (_userContext.RoleName == RoleNames.Admin) return true;
			var todoList = _cachedTaskTodoList ?? _taskTodoListDal.Get(p => p.Id.Equals(taskTodoListId));
			var board = _boardDal.GetBoardByTaskId(todoList.TaskId) ?? throw new BadRequestException(BoardMessages.BoardNotFound);
			var access = _boardDal.CanUserAccessToBoard(board.Id, _userContext.UserId);
			if (access) return true;
			throw new ForbiddenAccessException();
		}

		private bool TaskTodoListExists(int taskTodoListId)
		{
			_cachedTaskTodoList = _taskTodoListDal.Get(p => p.Id.Equals(taskTodoListId));
			return _cachedTaskTodoList != null;
		}
	}
}
