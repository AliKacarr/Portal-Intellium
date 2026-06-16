using Core.Utilities.Results.Abstract;
using Entities.Concrete;
using Entities.DTOs.TicketAttachmentDtos;
using IResult = Core.Utilities.Results.Abstract.IResult;

namespace Business.Repository.TicketAttachmentRepository
{
    public interface ITicketAttachmentService
    {
        IDataResult<List<TicketAttachment>> GetAllByTicketId(long ticketId);
        Task<IResult> Add(AddTicketAttachmentDto addTicketAttachmentDto);
        IResult Delete(long ticketAttachmentId);
    }
}
