using Business.Repository.TicketCommentRepository.Constants;
using Core.Identity;
using Core.Utilities.Exceptions;
using DataAccess.Repository.CommentReplyRepository;
using Entities.Concrete;
using Entities.DTOs.TicketCommentReplyDtos;
using FluentValidation;

namespace Business.Repository.TicketCommentReplyRepository.Validations
{
	public class UpdateTicketCommentReplyValidator : AbstractValidator<EditTicketCommentReplyDto>
	{
		private readonly ITicketCommentReplyDal _ticketCommentReplyDal;
		private readonly IUserContext _userContext;
		private TicketCommentReply? _cachedTicketCommentReply;
		public UpdateTicketCommentReplyValidator(ITicketCommentReplyDal ticketCommentReplyDal, IUserContext userContext)
		{
			_ticketCommentReplyDal = ticketCommentReplyDal;
			_userContext = userContext;

			RuleFor(c => c.Content).NotEmpty().WithMessage("İçerik boş olamaz.");

			RuleFor(commentReply => commentReply.Id)
				.Must(CommentReplyExists).WithMessage(TicketCommentMessages.TicketCommentNotFound)
				.Must(UserHasPermission);
		}

		private bool CommentReplyExists(long id)
		{
			_cachedTicketCommentReply = _ticketCommentReplyDal.Get(t => t.Id == id);
			return _cachedTicketCommentReply != null;
		}
		private bool UserHasPermission(long id)
		{
			var commentReply = _cachedTicketCommentReply ?? _ticketCommentReplyDal.Get(t => t.Id == id);
			if (commentReply == null) return false;

			if (commentReply.UserId == _userContext.UserId || _userContext.RoleName == RoleNames.Admin)
				return true;

			throw new ForbiddenAccessException();
		}
	}
}
