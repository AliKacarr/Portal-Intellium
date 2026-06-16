using Business.Repository.TicketEffortRepository.Constants;
using Core.Identity;
using Core.Utilities.Exceptions;
using DataAccess.Repository.TicketEffortRepository;
using DataAccess.Repository.TicketRepository;
using Entities.Concrete;
using FluentValidation;

namespace Business.Repository.TicketEffortRepository.Validations
{
	public class DeleteTicketEffortValidator : AbstractValidator<long>
	{
		private readonly ITicketDal _ticketDal;
		private readonly ITicketEffortDal _ticketEffortDal;
		private readonly IUserContext _userContext;
		private TicketEffort? _cachedTicketEffort;

		public DeleteTicketEffortValidator(ITicketDal ticketDal, ITicketEffortDal ticketEffortDal, IUserContext userContext)
		{
			_ticketDal = ticketDal;
			_ticketEffortDal = ticketEffortDal;
			_userContext = userContext;

			RuleFor(effortId => effortId)
				.Cascade(CascadeMode.Stop)
				.Must(TicketEffortExists).WithMessage(TicketEffortMessages.EffortNotFound)
				.Must(UserHasPermission);
		}


		private bool TicketEffortExists(long ticketEffortId)
		{
			_cachedTicketEffort = _ticketEffortDal.Get(p => p.Id.Equals(ticketEffortId));
			return _cachedTicketEffort != null;
		}
		private bool UserHasPermission(long ticketEffortId)
		{
			var ticketEffort = _cachedTicketEffort ?? _ticketEffortDal.Get(p => p.Id.Equals(ticketEffortId));

			var ticket = _ticketDal.Get(b => b.Id == ticketEffort.TicketId);
			if (ticket.AssignedUserId == _userContext.UserId || _userContext.RoleName == RoleNames.Admin)
				return true;

			throw new ForbiddenAccessException();
		}
	}
}
