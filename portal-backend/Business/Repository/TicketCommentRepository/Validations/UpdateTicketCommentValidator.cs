using Business.Repository.TicketCommentRepository.Constants;
using Core.Identity;
using Core.Utilities.Exceptions;
using DataAccess.Repository.TicketCommentRepository;
using Entities.Concrete;
using Entities.DTOs.TicketCommentDtos;
using FluentValidation;

namespace Business.Repository.TicketCommentRepository.Validations
{
	public class UpdateTicketCommentValidator : AbstractValidator<EditTicketCommentDto>
	{
		private readonly ITicketCommentDal _ticketCommentDal;
		private readonly IUserContext _userContext;
		private TicketComment? _cachedTicketComment;

		public UpdateTicketCommentValidator(ITicketCommentDal ticketCommentDal, IUserContext userContext)
		{
			_ticketCommentDal = ticketCommentDal;
			_userContext = userContext;

			RuleFor(c => c.Content).NotEmpty().WithMessage("İçerik boş olamaz.");

			RuleFor(comment => comment.Id)
				.Must(CommentExists).WithMessage(TicketCommentMessages.TicketCommentNotFound)
				.Must(UserHasPermission);
		}

		private bool CommentExists(long id)
		{
			_cachedTicketComment = _ticketCommentDal.Get(t => t.Id == id);
			return _cachedTicketComment != null;
		}
		private bool UserHasPermission(long id)
		{
			var comment = _cachedTicketComment ?? _ticketCommentDal.Get(t => t.Id == id);
			if (comment == null) return false;

			if (comment.UserId == _userContext.UserId || _userContext.RoleName == RoleNames.Admin)
				return true;

			throw new ForbiddenAccessException();
		}
	}
}
