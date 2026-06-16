using Business.Repository.RolesForUsersRepository;
using Business.Repository.TicketRepository.Constants;
using Business.Repository.UserRepository.Constants;
using Core.Identity;
using DataAccess.Repository.TicketRepository;
using DataAccess.Repository.UserRepository;
using Entities.Concrete;
using Entities.DTOs.TicketDtos;
using FluentValidation;

namespace Business.Repository.TicketRepository.Validations
{
	public class AssignUserToTicketValidator : AbstractValidator<AssignUserToTicketDto>
	{
		private readonly ITicketDal _ticketDal;
		private readonly IUserDal _userDal;
		private readonly IRolesForUsersService _rolesForUsersService;
		private Ticket? _cachedTicket;

		public AssignUserToTicketValidator(ITicketDal ticketDal, IUserDal userDal, IRolesForUsersService rolesForUsersService)
		{
			_ticketDal = ticketDal;
			_userDal = userDal;
			_rolesForUsersService = rolesForUsersService;

			RuleFor(ticket => ticket.Id)
				.Cascade(CascadeMode.Stop)
				.Must(TicketExists).WithMessage(TicketMessages.TicketNotFound)
				.Must(TicketHasNoAssignedUser).WithMessage(TicketMessages.TicketAlreadyHaveAssignedUser);

			RuleFor(ticket => ticket.AssignedUserId)
				.Cascade(CascadeMode.Stop)
				.Must(UserExists).WithMessage(UserMessages.UserNotFound)
				.Must(UserIsNotRegularUser).WithMessage("Atanmak istenen kullanıcının rolü 'user' olamaz.");
		}

		private bool TicketExists(long ticketId)
		{
			_cachedTicket = _ticketDal.Get(t => t.Id == ticketId);
			return _cachedTicket != null;
		}

		private bool TicketHasNoAssignedUser(long ticketId)
		{
			var ticket = _cachedTicket ?? _ticketDal.Get(t => t.Id == ticketId);
			return ticket != null && ticket.AssignedUserId == null;
		}

		private bool UserIsNotRegularUser(long userId)
		{
			var roleResult = _rolesForUsersService.GetRoleNameByUserId(userId);
			if (!roleResult.Success || roleResult.Data == RoleNames.User)
				return false;
			return true;
		}

		private bool UserExists(long userId)
		{
			var userResult = _userDal.Get(user => user.Id.Equals(userId));
			return userResult != null;
		}
	}
}
