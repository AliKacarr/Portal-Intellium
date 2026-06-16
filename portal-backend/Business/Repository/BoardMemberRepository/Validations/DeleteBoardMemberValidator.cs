using Business.Repository.BoardMemberRepository.Constants;
using Business.Repository.BoardRepository.Constants;
using Core.Identity;
using Core.Utilities.Exceptions;
using DataAccess.Repository.BoardRepository;
using Entities.Concrete;
using FluentValidation;

namespace Business.Repository.BoardMemberRepository.Validations
{
	public class DeleteBoardMemberValidator : AbstractValidator<int>
	{
		private readonly IBoardMemberDal _boardMemberDal;
		private readonly IUserContext _userContext;
		private readonly IBoardDal _boardDal;
		private BoardMember? _cachedBoardMember;
		public DeleteBoardMemberValidator(IBoardMemberDal boardMemberDal, IUserContext userContext, IBoardDal boardDal)
		{
			_boardMemberDal = boardMemberDal;
			_userContext = userContext;
			_boardDal = boardDal;

			RuleFor(boardMemberId => boardMemberId)
				.Cascade(CascadeMode.Stop)
				.Must(BoardMemberExists).WithMessage(BoardMemberMessages.BoardMemberNotFound)
				.Must(UserHasPermission);
		}

		private bool BoardMemberExists(int boardMemberId)
		{
			_cachedBoardMember = _boardMemberDal.Get(p => p.Id.Equals(boardMemberId));
			return _cachedBoardMember != null;
		}


		private bool UserHasPermission(int boardMemberId)
		{
			var boardMember = _cachedBoardMember ?? _boardMemberDal.Get(bm => bm.Id == boardMemberId);

			var board = _boardDal.Get(b => b.Id == boardMember.BoardId) ??
				throw new BadRequestException(BoardMessages.BoardNotFound);

			if (board.CreatedUserId == boardMember.UserId)
			{
				throw new BadRequestException("Bu üye silinemez.");
			}
			if (board.CreatedUserId == _userContext.UserId || _userContext.RoleName == RoleNames.Admin)
				return true;
			throw new ForbiddenAccessException();
		}


	}
}
