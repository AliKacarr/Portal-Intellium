using Core.DataAccess;
using Entities.Concrete;
using Entities.DTOs.TicketCommentDtos;

namespace DataAccess.Repository.TicketCommentRepository
{
    public interface ITicketCommentDal : IEntityRepository<TicketComment>
    {
        List<GetTicketCommentDto> GetAllByTicketId(long ticketId);
    }
}
