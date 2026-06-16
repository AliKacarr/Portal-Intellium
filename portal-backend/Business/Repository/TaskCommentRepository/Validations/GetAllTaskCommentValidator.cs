using Business.Repository.BoardRepository.Constants;
using Core.Identity;
using Core.Utilities.Exceptions;
using DataAccess.Repository.BoardRepository;
using FluentValidation;

namespace Business.Repository.TaskCommentRepository.Validations
{
	public class GetAllTaskCommentValidator : AbstractValidator<int>
	{
		private readonly IBoardDal _boardDal;
		private readonly IUserContext _userContext;
		public GetAllTaskCommentValidator(IBoardDal boardDal, IUserContext userContext)
		{
			_boardDal = boardDal;
			_userContext = userContext;

			RuleFor(taskId => taskId).Must(UserHasAccess);
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
