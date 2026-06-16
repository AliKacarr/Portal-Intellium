using Business.Repository.BoardMemberRepository.Constants;
using Business.Repository.BoardRepository.Constants;
using Business.Repository.UserRepository.Constants;
using Core.Identity;
using Core.Utilities.Exceptions;
using DataAccess.Repository.BoardRepository;
using DataAccess.Repository.UserRepository;
using Entities.Concrete;
using Entities.DTOs.BoardMemberDtos;
using FluentValidation;

namespace Business.Repository.BoardMemberRepository.Validations
{
	public class AddBoardMemberValidator : AbstractValidator<AddBoardMembersDto>
	{
		private readonly IBoardDal _boardDal;
		private readonly IUserDal _userDal;
		private readonly IUserContext _userContext;
		private Board? _cachedBoard;
		public AddBoardMemberValidator(IBoardDal boardDal, IUserDal userDal, IUserContext userContext)
		{
			_boardDal = boardDal;
			_userDal = userDal;
			_userContext = userContext;

			RuleFor(members => members.BoardId).Cascade(CascadeMode.Stop)
				.Must(BoardExists).WithMessage(BoardMessages.BoardNotFound)
				.Must(UserHasPermission);

			RuleFor(members => members.UserIds)
			.Cascade(CascadeMode.Stop)
			.NotNull()
			.NotEmpty()
			.WithMessage(BoardMemberMessages.NoUsersToAssign)
			.Must(UserExists).WithMessage(UserMessages.UserNotFound);
		}

		private bool BoardExists(int boardId)
		{
			_cachedBoard = _boardDal.Get(p => p.Id == boardId);
			return _cachedBoard != null;
		}

		private bool UserExists(List<long> userIds)
		{
			var existingUserIds = _userDal.GetAll(p => userIds.Contains(p.Id)).Select(p => p.Id).ToList();
			return userIds.All(id => existingUserIds.Contains(id));
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
