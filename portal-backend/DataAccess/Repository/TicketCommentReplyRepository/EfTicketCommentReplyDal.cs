using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;

namespace DataAccess.Repository.CommentReplyRepository
{
    public class EfTicketCommentReplyDal : EfEntityRepositoryBase<TicketCommentReply, PortalContext>, ITicketCommentReplyDal
    {
    }
}
