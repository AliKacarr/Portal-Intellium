using Business.Repository.BoardRepository.Constants;
using Business.Repository.TaskCommentRepository.Constants;
using Core.Identity;
using Core.Utilities.Exceptions;
using DataAccess.Repository.BoardRepository;
using DataAccess.Repository.TaskRepository;
using Entities.Concrete;
using FluentValidation;

namespace Business.Repository.TaskCommentRepository.Validations
{
	public class DeleteTaskCommentValidator : AbstractValidator<int>
	{
		private readonly IBoardDal _boardDal;
		private readonly IUserContext _userContext;
		private readonly ITaskCommentDal _taskCommentDal;
		private TaskComment? _cachedTaskComment;

		public DeleteTaskCommentValidator(IBoardDal boardDal, IUserContext userContext, ITaskCommentDal taskCommentDal)
		{
			_boardDal = boardDal;
			_userContext = userContext;
			_taskCommentDal = taskCommentDal;

			RuleFor(taskCommentId => taskCommentId)
				.Cascade(CascadeMode.Stop)
				.Must(TaskCommentExists)
					.WithMessage(TaskCommentMessages.TaskCommentNotFound)
				.Must(UserHasAccess);
		}

		private bool TaskCommentExists(int taskCommentId)
		{
			_cachedTaskComment = _taskCommentDal.Get(p => p.Id == taskCommentId);
			return _cachedTaskComment != null;
		}

		private bool UserHasAccess(int taskCommentId)
		{
			if (_userContext.RoleName == RoleNames.Admin) return true;
			var taskComment = _cachedTaskComment ?? _taskCommentDal.Get(p => p.Id == taskCommentId);
			if (taskComment.UserId != _userContext.UserId) throw new ForbiddenAccessException();
			var board = _boardDal.GetBoardByTaskId(taskComment.TaskId) ?? throw new BadRequestException(BoardMessages.BoardNotFound);
			var hasAccess = _boardDal.CanUserAccessToBoard(board.Id, _userContext.UserId);
			if (!hasAccess) throw new ForbiddenAccessException();
			return true;
		}
	}
}
