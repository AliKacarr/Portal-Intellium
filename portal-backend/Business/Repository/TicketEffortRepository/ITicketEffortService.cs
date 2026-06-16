using Core.Utilities.Results.Abstract;
using Entities.DTOs.TicketEffortDtos;

namespace Business.Repository.TicketEffortRepository
{
    public interface ITicketEffortService
    {
        IDataResult<GetTicketEffortDto> Add(AddTicketEffortDto addTicketEffort);
        IResult Delete(long ticketEffortId);
        IDataResult<List<GetTicketEffortDto>> GetAllByTicketId(long ticketId);
    }
}
