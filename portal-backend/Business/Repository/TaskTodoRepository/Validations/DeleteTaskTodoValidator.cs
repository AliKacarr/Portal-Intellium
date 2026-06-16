using Business.Repository.BoardRepository.Constants;
using Business.Repository.TaskTodoRepository.Constants;
using Core.Identity;
using Core.Utilities.Exceptions;
using DataAccess.Repository.BoardRepository;
using DataAccess.Repository.TaskRepository;
using Entities.Concrete;
using FluentValidation;

namespace Business.Repository.TaskTodoRepository.Validations
{
	public class DeleteTaskTodoValidator : AbstractValidator<int>
	{
		private readonly ITaskTodoDal _taskTodoDal;
		private readonly ITaskTodoListDal _taskTodoListDal;
		private readonly IUserContext _userContext;
		private readonly IBoardDal _boardDal;
		private TaskTodo? _cachedTaskTodo;
		public DeleteTaskTodoValidator(ITaskTodoDal taskTodoDal, IUserContext userContext, IBoardDal boardDal, ITaskTodoListDal taskTodoListDal)
		{
			_taskTodoDal = taskTodoDal;
			_userContext = userContext;
			_boardDal = boardDal;
			_taskTodoListDal = taskTodoListDal;

			RuleFor(taskTodoId => taskTodoId)
				.Cascade(CascadeMode.Stop)
				.Must(TaskTodoExists).WithMessage(TaskTodoMessages.TaskTodoNotFound)
				.Must(UserHasAccess);
		}
		private bool UserHasAccess(int taskTodoId)
		{
			if (_userContext.RoleName == RoleNames.Admin) return true;
			var todo = _cachedTaskTodo ?? _taskTodoDal.Get(p => p.Id.Equals(taskTodoId));
			var todoList = _taskTodoListDal.Get(p => p.Id.Equals(todo.TaskTodoListId));
			var board = _boardDal.GetBoardByTaskId(todoList.TaskId) ?? throw new BadRequestException(BoardMessages.BoardNotFound);
			var access = _boardDal.CanUserAccessToBoard(board.Id, _userContext.UserId);
			if (access) return true;
			throw new ForbiddenAccessException();
		}

		private bool TaskTodoExists(int taskTodoId)
		{
			_cachedTaskTodo = _taskTodoDal.Get(p => p.Id.Equals(taskTodoId));
			return _cachedTaskTodo != null;
		}
	}
}
