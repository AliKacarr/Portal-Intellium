using Core.DataAccess;
using Core.Utilities.Results.Abstract;
using Entities.Concrete;
using Entities.DTOs.TicketDtos;

namespace DataAccess.Repository.TicketRepository
{
    public interface ITicketDal : IEntityRepository<Ticket>
    {
        bool CanUserAccessTicket(long ticketId, long customerId, long userId);
        Task<IResult> GetPaginatedByCustomerAndUserAsync(long customerId, long userId, int pageNumber, int pageSize);
        Task<IResult> GetPaginatedAsync(int pageNumber, int pageSize);
        List<GetTicketDto> GetAllByCustomerAndUser(long customerId, long userId);
        List<GetTicketDto> GetAllAsDto();
        List<GetTicketDto> GetLastTicketsByCustomerAndUser(long customerId, long userId, int ticketCount);
        List<GetTicketDto> GetLastTickets(int ticketCount);
        GetTicketDto GetById(long id);
        TicketCountDto GetTicketCount();
        TicketCountDto GetTicketCountByCustomerAndUser(long customerId, long userId);


    }
}
