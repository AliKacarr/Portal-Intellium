using Business.Repository.BoardRepository.Constants;
using Business.Repository.TaskAttachmentRepository.Constants;
using Core.Identity;
using Core.Utilities.Exceptions;
using DataAccess.Repository.BoardRepository;
using DataAccess.Repository.TaskRepository;
using Entities.Concrete;
using FluentValidation;

namespace Business.Repository.TaskAttachmentRepository.Validations
{
	public class DeleteTaskAttachmentValidator : AbstractValidator<int>
	{
		private readonly IBoardDal _boardDal;
		private readonly IUserContext _userContext;
		private readonly ITaskAttachmentDal _taskAttachmentDal;
		private TaskAttachment? _cachedTaskAttachment;
		public DeleteTaskAttachmentValidator(IBoardDal boardDal, IUserContext userContext, ITaskAttachmentDal taskAttachmentDal)
		{
			_boardDal = boardDal;
			_taskAttachmentDal = taskAttachmentDal;
			_userContext = userContext;

			RuleFor(taskAttachmentId => taskAttachmentId)
				.Cascade(CascadeMode.Stop)
				.Must(TaskAttachmentExists).WithMessage(TaskAttachmentMessages.TaskAttachmentNotFound)
				.Must(UserHasAccess);
		}
		private bool UserHasAccess(int taskAttachmentId)
		{
			if (_userContext.RoleName == RoleNames.Admin) return true;
			var taskAttachment = _cachedTaskAttachment ?? _taskAttachmentDal.Get(p => p.Id.Equals(taskAttachmentId));
			var board = _boardDal.GetBoardByTaskId(taskAttachment.TaskId) ?? throw new BadRequestException(BoardMessages.BoardNotFound);
			var access = _boardDal.CanUserAccessToBoard(board.Id, _userContext.UserId);
			if (access) return true;
			throw new ForbiddenAccessException();
		}

		private bool TaskAttachmentExists(int taskAttachmentId)
		{
			_cachedTaskAttachment = _taskAttachmentDal.Get(p => p.Id.Equals(taskAttachmentId));
			return _cachedTaskAttachment != null;
		}
	}
}
