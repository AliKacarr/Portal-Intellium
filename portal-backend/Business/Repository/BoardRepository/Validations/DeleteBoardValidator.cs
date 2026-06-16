using Business.Repository.BoardRepository.Constants;
using Core.Identity;
using Core.Utilities.Exceptions;
using DataAccess.Repository.BoardRepository;
using Entities.Concrete;
using FluentValidation;

namespace Business.Repository.BoardRepository.Validations
{
	public class DeleteBoardValidator : AbstractValidator<int>
	{
		private readonly IBoardDal _boardDal;
		private readonly IUserContext _userContext;
		private Board? _cachedBoard;
		public DeleteBoardValidator(IBoardDal boardDal, IUserContext userContext)
		{
			_userContext = userContext;
			_boardDal = boardDal;

			RuleFor(boardId => boardId)
				.Cascade(CascadeMode.Stop)
				.Must(BoardExists).WithMessage(BoardMessages.BoardNotFound)
				.Must(UserHasPermission);
		}

		private bool BoardExists(int boardId)
		{
			_cachedBoard = _boardDal.Get(b => b.Id == boardId);
			return _cachedBoard != null;
		}

		private bool UserHasPermission(int boardId)
		{
			var board = _cachedBoard ?? _boardDal.Get(b => b.Id == boardId);
			if (board.CreatedUserId == _userContext.UserId || _userContext.RoleName == RoleNames.Admin)
				return true;
			throw new ForbiddenAccessException();
		}
	}
}
