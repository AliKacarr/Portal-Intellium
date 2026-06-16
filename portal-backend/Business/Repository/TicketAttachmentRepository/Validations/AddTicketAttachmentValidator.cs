using Business.Repository.TicketRepository.Constants;
using Core.Identity;
using Core.Utilities.Exceptions;
using DataAccess.Repository.TicketRepository;
using Entities.DTOs.TicketAttachmentDtos;
using FluentValidation;
using Microsoft.AspNetCore.Http;

namespace Business.Repository.TicketAttachmentRepository.Validations
{
	public class AddTicketAttachmentValidator : AbstractValidator<AddTicketAttachmentDto>
	{
		private readonly ITicketDal _ticketDal;
		private readonly IUserContext _userContext;

		public AddTicketAttachmentValidator(ITicketDal ticketDal, IUserContext userContext)
		{
			_ticketDal = ticketDal;
			_userContext = userContext;

			RuleFor(ticketAttachment => ticketAttachment.TicketAttachments)
				.Cascade(CascadeMode.Stop)
				.NotEmpty().WithMessage("Ek dosya listesi boş olamaz.")
				.Must(ContainValidFiles).WithMessage("Ek dosya listesinde geçerli bir dosya bulunmalıdır.");


			RuleFor(ticketAttachment => ticketAttachment.TicketId)
				.Cascade(CascadeMode.Stop)
				.Must(TicketExists).WithMessage(TicketMessages.TicketNotFound)
				.Must(UserHasAccessToTicket);
		}

		private bool ContainValidFiles(List<IFormFile> files)
		{
			return files != null && files.Any(file => file.Length > 0);
		}

		private bool TicketExists(long ticketId)
		{
			return _ticketDal.Get(t => t.Id == ticketId) != null;
		}

		private bool UserHasAccessToTicket(long ticketId)
		{
			var access = _ticketDal.CanUserAccessTicket(ticketId, _userContext.CustomerId, _userContext.UserId);
			if (access) return true;
			throw new ForbiddenAccessException();
		}
	}

}
