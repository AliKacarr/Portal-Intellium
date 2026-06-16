using Business.Repository.BoardRepository.Constants;
using Core.Identity;
using Core.Utilities.Exceptions;
using DataAccess.Repository.BoardRepository;
using FluentValidation;

namespace Business.Repository.BoardRepository.Validations
{
	public class GetBoardValidator : AbstractValidator<int>
	{
		private readonly IBoardDal _boardDal;
		private readonly IUserContext _userContext;
		public GetBoardValidator(IBoardDal boardDal, IUserContext userContext)
		{
			_boardDal = boardDal;
			_userContext = userContext;

			RuleFor(ticketId => ticketId)
			   .Cascade(CascadeMode.Stop)
			   .Must(BoardExists).WithMessage(BoardMessages.BoardNotFound)
			   .Must(UserHasAccessToBoard);
		}

		private bool BoardExists(int boardId)
		{
			return _boardDal.Get(b => b.Id == boardId) != null;
		}
		private bool UserHasAccessToBoard(int boardId)
		{
			if (_userContext.RoleName == RoleNames.Admin) return true;
			var access = _boardDal.CanUserAccessToBoard(boardId, _userContext.UserId);
			if (access) return true;
			throw new ForbiddenAccessException();
		}
	}
}
