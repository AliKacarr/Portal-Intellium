using Business.Repository.TicketRepository.Constants;
using Core.Identity;
using Core.Utilities.Exceptions;
using DataAccess.Repository.TicketRepository;
using Entities.Concrete;
using FluentValidation;

namespace Business.Repository.TicketRepository.Validations
{
	public class MarkAsResolvedTicketValidator : AbstractValidator<long>
	{
		private readonly ITicketDal _ticketDal;
		private readonly IUserContext _userContext;
		private Ticket? _cachedTicket;

		public MarkAsResolvedTicketValidator(ITicketDal ticketDal, IUserContext userContext)
		{
			_ticketDal = ticketDal;
			_userContext = userContext;

			RuleFor(ticketId => ticketId)
				.Must(TicketExists).WithMessage(TicketMessages.TicketNotFound)
				.Must(UserHasPermission);
		}

		private bool TicketExists(long id)
		{
			_cachedTicket = _ticketDal.Get(t => t.Id == id);
			return _cachedTicket != null;
		}
		private bool UserHasPermission(long id)
		{
			var ticket = _cachedTicket ?? _ticketDal.Get(t => t.Id == id);
			if (ticket == null) return false;

			if (ticket.CreatorUserId == _userContext.UserId || _userContext.RoleName == RoleNames.Admin)
				return true;

			throw new ForbiddenAccessException();
		}
	}
}
