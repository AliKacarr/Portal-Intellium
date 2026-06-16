using Business.Repository.TicketEffortRepository.Constants;
using Business.Repository.TicketRepository.Constants;
using Core.Identity;
using Core.Utilities.Exceptions;
using DataAccess.Repository.TicketRepository;
using Entities.Concrete;
using Entities.DTOs.TicketEffortDtos;
using FluentValidation;

namespace Business.Repository.TicketEffortRepository.Validations
{
	public class AddTicketEffortValidator : AbstractValidator<AddTicketEffortDto>
	{
		private readonly ITicketDal _ticketDal;
		private readonly IUserContext _userContext;
		private Ticket? _cachedTicket;

		public AddTicketEffortValidator(ITicketDal ticketDal, IUserContext userContext)
		{
			_ticketDal = ticketDal;
			_userContext = userContext;

			RuleFor(effort => effort.TicketId)
				.Cascade(CascadeMode.Stop)
				.Must(TicketExists).WithMessage(TicketMessages.TicketNotFound)
				.Must(UserHasPermission)
				.Must(IsTicketAssigned).WithMessage(TicketMessages.TicketNotAssigned);

			RuleFor(effort => effort.EffortMinutes).GreaterThan(0).WithMessage(TicketEffortMessages.EffortRequired);

			RuleFor(x => x.Description)
				.Cascade(CascadeMode.Stop)
				.NotEmpty().WithMessage(TicketEffortMessages.DescriptionRequired)
				.MaximumLength(500).WithMessage(TicketEffortMessages.DescriptionMaxLength);
		}

		private bool TicketExists(long ticketId)
		{
			_cachedTicket = _ticketDal.Get(p => p.Id.Equals(ticketId));
			return _cachedTicket != null;
		}
		private bool UserHasPermission(long ticketId)
		{
			var ticket = _cachedTicket ?? _ticketDal.Get(b => b.Id == ticketId);

			if (ticket.AssignedUserId == _userContext.UserId || _userContext.RoleName == RoleNames.Admin)
				return true;

			throw new ForbiddenAccessException();
		}

		private bool IsTicketAssigned(long ticketId)
		{
			var ticket = _cachedTicket ?? _ticketDal.Get(b => b.Id == ticketId);
			return ticket.Status == Entities.Enums.TicketStatus.Assigned;
		}
	}
}
