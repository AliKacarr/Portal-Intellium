using Core.Identity;
using Core.Utilities.Exceptions;
using DataAccess.Repository.BoardRepository;
using FluentValidation;

namespace Business.Repository.TaskListRepository.Validations
{
	public class GetAllTaskListValidator : AbstractValidator<int>
	{
		private readonly IBoardDal _boardDal;
		private readonly IUserContext _userContext;
		public GetAllTaskListValidator(IUserContext userContext, IBoardDal boardDal)
		{
			_userContext = userContext;
			_boardDal = boardDal;

			RuleFor(boardId => boardId).Must(UserHasAccess);
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
