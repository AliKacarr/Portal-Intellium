using Business.Repository.BoardCategoryRepository.Constants;
using Business.Repository.BoardRepository.Constants;
using Core.Identity;
using Core.Utilities.Exceptions;
using DataAccess.Repository.BoardRepository;
using Entities.Concrete;
using Entities.DTOs.BoardDtos;
using FluentValidation;

namespace Business.Repository.BoardRepository.Validations
{
	public class UpdateBoardValidator : AbstractValidator<EditBoardDto>
	{
		private readonly IBoardDal _boardDal;
		private readonly IBoardCategoryDal _boardCategoryDal;
		private readonly IUserContext _userContext;
		private Board? _cachedBoard;

		public UpdateBoardValidator(IBoardDal boardDal, IBoardCategoryDal boardCategoryDal, IUserContext userContext)
		{
			_boardDal = boardDal;
			_boardCategoryDal = boardCategoryDal;
			_userContext = userContext;

			RuleFor(board => board.Id)
				.Cascade(CascadeMode.Stop)
				.Must(BoardExists).WithMessage(BoardMessages.BoardNotFound)
				.Must(UserHasPermission);

			RuleFor(board => board.CategoryId).Must(CategoryExists).WithMessage(BoardCategoryMessages.BoardCategoryNotFound);
		}
		private bool BoardExists(int boardId)
		{
			var _cachedBoard = _boardDal.Get(b => b.Id == boardId);
			return _cachedBoard != null;
		}
		private bool CategoryExists(int categoryId)
		{
			return _boardCategoryDal.Get(c => c.Id == categoryId) != null;
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
