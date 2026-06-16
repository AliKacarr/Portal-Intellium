using Business.Repository.BoardRepository.Constants;
using Core.Identity;
using Core.Utilities.Exceptions;
using DataAccess.Repository.BoardRepository;
using Entities.DTOs.TaskListDtos;
using FluentValidation;

namespace Business.Repository.TaskListRepository.Validations
{
	public class AddTaskListValidator : AbstractValidator<AddTaskListDto>
	{
		private readonly IBoardDal _boardDal;
		private readonly IUserContext _userContext;
		public AddTaskListValidator(IBoardDal boardDal, IUserContext userContext)
		{
			_boardDal = boardDal;
			_userContext = userContext;

			RuleFor(tl => tl.BoardId)
				.Cascade(CascadeMode.Stop)
				.Must(BoardExists).WithMessage(BoardMessages.BoardNotFound)
				.Must(UserHasAccess);
		}

		private bool BoardExists(int boardId)
		{
			return _boardDal.Get(b => b.Id.Equals(boardId)) != null;
		}

		private bool UserHasAccess(int boardId)
		{
			if (_userContext.RoleName == RoleNames.Admin) return true;
			var access = _boardDal.CanUserAccessToBoard(boardId, _userContext.UserId);
			if (access) return true;
			throw new ForbiddenAccessException();
		}
	}
}
