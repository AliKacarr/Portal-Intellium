using Business.Repository.TicketRepository.Constants;
using Core.Identity;
using Core.Utilities.Exceptions;
using DataAccess.Repository.TicketRepository;
using FluentValidation;

namespace Business.Repository.TicketRepository.Validations
{
	public class GetByIdTicketValidator : AbstractValidator<long>
	{
		private readonly ITicketDal _ticketDal;
		private readonly IUserContext _userContext;
		public GetByIdTicketValidator(ITicketDal ticketDal, IUserContext userContext)
		{
			_ticketDal = ticketDal;
			_userContext = userContext;

			RuleFor(ticketId => ticketId)
				.Cascade(CascadeMode.Stop)
				.Must(TicketExists).WithMessage(TicketMessages.TicketNotFound)
				.Must(UserHasAccessToTicket);

		}
		private bool TicketExists(long ticketId)
		{
			return _ticketDal.Get(t => t.Id == ticketId) != null;
		}
		private bool UserHasAccessToTicket(long ticketId)
		{
			if (_userContext.RoleName != RoleNames.User) return true;
			var access = _ticketDal.CanUserAccessTicket(ticketId, _userContext.CustomerId, _userContext.UserId);
			if (access) return true;
			throw new ForbiddenAccessException();
		}
	}
}
