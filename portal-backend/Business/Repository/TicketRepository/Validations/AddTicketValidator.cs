using Business.Repository.CustomerRepository.Constants;
using Business.Repository.ProjectRepository.Constants;
using Business.Repository.TicketRepository.Constants;
using Business.Repository.UserRepository.Constants;
using Core.Identity;
using DataAccess.Repository.CustomerRepository;
using DataAccess.Repository.ProjectRepository;
using DataAccess.Repository.UserRepository;
using Entities.DTOs.TicketDtos;
using FluentValidation;

namespace Business.Repository.TicketRepository.Validations
{
    public class AddTicketValidator : AbstractValidator<AddTicketDto>
    {
        public AddTicketValidator(IProjectDal projectDal, ICustomerDal customerDal, IUserDal userDal, IUserContext userContext)
        {
            RuleFor(ticket => ticket.Name).NotEmpty().WithMessage(TicketMessages.TicketNameCanNotBeEmpty);

            RuleFor(ticket => ticket.ProjectId)
                .Must(projectId => projectDal.Get(project => project.Id.Equals(projectId)) is not null)
                .WithMessage(ProjectMessages.ProjectNotFound);

            RuleFor(_ => userContext.CustomerId)
                .Must(customerId => customerDal.Get(customer => customer.CustomerId.Equals(customerId)) is not null)
                .WithMessage(CustomerMessages.CustomerNotFound);

            RuleFor(_ => userContext.UserId)
                .Must(userId => userDal.Get(user => user.Id.Equals(userId)) is not null)
                .WithMessage(UserMessages.UserNotFound);
        }
    }
}
