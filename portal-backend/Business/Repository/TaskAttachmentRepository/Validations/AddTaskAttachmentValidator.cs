using Business.Repository.BoardRepository.Constants;
using Business.Repository.TaskRepository.Constants;
using Core.Identity;
using Core.Utilities.Exceptions;
using DataAccess.Repository.BoardRepository;
using DataAccess.Repository.TaskRepository;
using FluentValidation;

namespace Business.Repository.TaskAttachmentRepository.Validations
{
	public class AddTaskAttachmentValidator : AbstractValidator<int>
	{
		private readonly IBoardDal _boardDal;
		private readonly ITaskDal _taskDal;
		private readonly IUserContext _userContext;
		public AddTaskAttachmentValidator(IBoardDal boardDal, IUserContext userContext, ITaskDal taskDal)
		{
			_boardDal = boardDal;
			_taskDal = taskDal;
			_userContext = userContext;

			RuleFor(taskId => taskId)
				.Cascade(CascadeMode.Stop)
				.Must(TaskExists).WithMessage(TaskMessages.TaskNotFound)
				.Must(UserHasAccess);
		}

		private bool UserHasAccess(int taskId)
		{
			if (_userContext.RoleName == RoleNames.Admin) return true;
			var board = _boardDal.GetBoardByTaskId(taskId) ?? throw new BadRequestException(BoardMessages.BoardNotFound);
			var access = _boardDal.CanUserAccessToBoard(board.Id, _userContext.UserId);
			if (access) return true;
			throw new ForbiddenAccessException();
		}

		private bool TaskExists(int taskId)
		{
			return _taskDal.Get(p => p.Id.Equals(taskId)) != null;
		}
	}
}
