using Core.Utilities.Results.Abstract;
using Entities.DTOs.TicketDtos;
using Microsoft.AspNetCore.Http;
using IResult = Core.Utilities.Results.Abstract.IResult;

namespace Business.Repository.TicketRepository
{
    public interface ITicketService
    {
        Task<IResult> Add(AddTicketDto ticket, List<IFormFile>? attachments);
        IResult Update(EditTicketDto addTicket);
        IResult AssignUser(AssignUserToTicketDto assignUserToTicket);
        IResult MarkAsResolved(long id);
        IDataResult<List<GetTicketDto>> GetAll();
        Task<IResult> GetPaginatedTickets(int pageNumber, int pageSize);
        IDataResult<List<GetTicketDto>> GetLastTickets(int ticketCount);
        IDataResult<GetTicketDto> GetById(long id);
        IDataResult<TicketCountDto> GetTicketCount();
    }
}
