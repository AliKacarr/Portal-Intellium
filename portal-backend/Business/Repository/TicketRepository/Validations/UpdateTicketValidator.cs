using Business.Repository.TicketRepository.Constants;
using DataAccess.Repository.TicketRepository;
using DataAccess.Repository.UserRepository;
using Entities.DTOs.TicketDtos;
using Entities.Enums;
using FluentValidation;

namespace Business.Repository.TicketRepository.Validations
{
    public class UpdateTicketValidator : AbstractValidator<EditTicketDto>
    {
        public UpdateTicketValidator(ITicketDal ticketDal, IUserDal userDal)
        {
            RuleFor(ticket => ticket.Id)
                .Must(id => ticketDal.Get(t => t.Id.Equals(id)) is not null)
                .WithMessage(TicketMessages.TicketNotFound);

            RuleFor(ticket => ticket.Status)
                .Must(status => Enum.IsDefined(typeof(TicketStatus), status))
                .WithMessage("Geçersiz bir durum değeri girildi.");

            RuleFor(ticket => ticket.AssignedUserId)
                .Must((ticket, userId) => !userId.HasValue || userDal.Get(user => user.Id.Equals(userId.Value)) is not null)
                .WithMessage("Atanan kullanıcı geçerli değil.");
        }
    }
}
