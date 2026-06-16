using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;

namespace DataAccess.Repository.TicketAttachmentRepository
{
    public class EfTicketAttachmentDal : EfEntityRepositoryBase<TicketAttachment, PortalContext>, ITicketAttachmentDal
    {
    }
}
