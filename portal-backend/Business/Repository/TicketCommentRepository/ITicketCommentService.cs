using Core.Utilities.Results.Abstract;
using Entities.DTOs.TicketCommentDtos;

namespace Business.Repository.TicketCommentRepository
{
    public interface ITicketCommentService
    {
        IResult Add(AddTicketCommentDto addTicketComment);
        IResult Update(EditTicketCommentDto editTicketComment);
        IResult Delete(long ticketCommentId);
        IResult DeleteAllByTicketId(long ticketId);
        IDataResult<List<GetTicketCommentDto>> GetAllByTicketId(long ticketId);

    }
}
