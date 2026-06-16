using Business.Repository.BoardRepository.Constants;
using Business.Repository.TaskRepository.Constants;
using Core.Identity;
using Core.Utilities.Exceptions;
using DataAccess.Repository.BoardRepository;
using DataAccess.Repository.TaskRepository;
using Entities.DTOs.TaskDtos;
using FluentValidation;

namespace Business.Repository.TaskRepository.Validations
{
	public class UpdateOrderTaskValidator : AbstractValidator<List<TaskOrderEditDto>>
	{
		private readonly ITaskDal _taskDal;
		private readonly IBoardDal _boardDal;
		private readonly IUserContext _userContext;

		public UpdateOrderTaskValidator(ITaskDal taskDal, IBoardDal boardDal, IUserContext userContext)
		{
			_taskDal = taskDal;
			_boardDal = boardDal;
			_userContext = userContext;

			RuleForEach(task => task)
				.Cascade(CascadeMode.Stop)
				.Must(TaskExists).WithMessage(TaskMessages.TaskNotFound)
				.Must(UserHasAccess)
				.DependentRules(() =>
				{
					RuleForEach(task => task)
						.Must(HasValidOrderNo).WithMessage(TaskMessages.InvalidOrderNo);
				});
		}

		private bool TaskExists(TaskOrderEditDto task)
		{
			return _taskDal.Get(t => t.Id.Equals(task.Id)) != null;
		}

		private bool HasValidOrderNo(TaskOrderEditDto task)
		{
			return task.OrderNo >= 0;
		}

		private bool UserHasAccess(TaskOrderEditDto task)
		{
			if (_userContext.RoleName == RoleNames.Admin) return true;
			var board = _boardDal.GetBoardByTaskId(task.Id) ?? throw new BadRequestException(BoardMessages.BoardNotFound);
			var access = _boardDal.CanUserAccessToBoard(board.Id, _userContext.UserId);
			if (access) return true;
			throw new ForbiddenAccessException();
		}
	}
}
