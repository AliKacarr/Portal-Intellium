using Business.Repository.TicketCommentRepository.Constants;
using Core.Identity;
using Core.Utilities.Exceptions;
using DataAccess.Repository.TicketCommentRepository;
using DataAccess.Repository.TicketRepository;
using Entities.Concrete;
using Entities.DTOs.TicketCommentReplyDtos;
using FluentValidation;

namespace Business.Repository.TicketCommentReplyRepository.Validations
{
	public class AddTicketCommentReplyValidator : AbstractValidator<AddTicketCommentReplyDto>
	{
		private readonly ITicketCommentDal _ticketCommentDal;
		private readonly ITicketDal _ticketDal;
		private readonly IUserContext _userContext;
		private TicketComment? _cachedTicketComment;
		public AddTicketCommentReplyValidator(ITicketCommentDal ticketCommentDal, ITicketDal ticketDal, IUserContext userContext)
		{
			_ticketCommentDal = ticketCommentDal;
			_ticketDal = ticketDal;
			_userContext = userContext;

			RuleFor(c => c.Content).NotEmpty().WithMessage("İçerik boş olamaz.");

			RuleFor(reply => reply.TicketCommentId)
				.Cascade(CascadeMode.Stop)
				.Must(CommentExists).WithMessage(TicketCommentMessages.TicketCommentNotFound)
				.Must(UserHasAccessToTicket);
		}

		private bool CommentExists(long commentId)
		{
			_cachedTicketComment = _ticketCommentDal.Get(t => t.Id == commentId);
			return _cachedTicketComment != null;
		}

		private bool UserHasAccessToTicket(long ticketCommentId)
		{
			if (_userContext.RoleName != RoleNames.User) return true;
			var comment = _cachedTicketComment ?? _ticketCommentDal.Get(t => t.Id == ticketCommentId);
			var access = _ticketDal.CanUserAccessTicket(comment.TicketId, _userContext.CustomerId, _userContext.UserId);
			if (access) return true;
			throw new ForbiddenAccessException();
		}
	}
}
