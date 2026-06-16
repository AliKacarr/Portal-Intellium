using Business.Repository.BoardRepository.Constants;
using Business.Repository.TaskRepository.Constants;
using Core.Identity;
using Core.Utilities.Exceptions;
using DataAccess.Repository.BoardRepository;
using DataAccess.Repository.TaskRepository;
using FluentValidation;

namespace Business.Repository.TaskRepository.Validations
{
	public class GetByIdTaskValidator : AbstractValidator<int>
	{
		private readonly IBoardDal _boardDal;
		private readonly ITaskDal _taskDal;
		private readonly IUserContext _userContext;
		public GetByIdTaskValidator(IUserContext userContext, IBoardDal boardDal, ITaskDal taskDal)
		{
			_userContext = userContext;
			_boardDal = boardDal;
			_taskDal = taskDal;

			RuleFor(taskId => taskId)
				.Cascade(CascadeMode.Stop)
				.Must(TaskExists).WithMessage(TaskMessages.TaskNotFound)
				.Must(UserHasAccess);
		}
		private bool TaskExists(int taskId)
		{
			return _taskDal.Get(t => t.Id == taskId) != null;
		}
		private bool UserHasAccess(int taskId)
		{
			if (_userContext.RoleName == RoleNames.Admin) return true;
			var board = _boardDal.GetBoardByTaskId(taskId) ?? throw new BadRequestException(BoardMessages.BoardNotFound);
			var access = _boardDal.CanUserAccessToBoard(board.Id, _userContext.UserId);
			if (access) return true;
			throw new ForbiddenAccessException();
		}
	}
}
