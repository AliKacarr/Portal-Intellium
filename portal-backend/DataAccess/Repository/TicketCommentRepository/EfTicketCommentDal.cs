using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;
using Entities.DTOs.TicketCommentDtos;
using Entities.DTOs.TicketCommentReplyDtos;

namespace DataAccess.Repository.TicketCommentRepository
{
    public class EfTicketCommentDal : EfEntityRepositoryBase<TicketComment, PortalContext>, ITicketCommentDal
    {
        public List<GetTicketCommentDto> GetAllByTicketId(long ticketId)
        {
            using var context = new PortalContext();
            var result = (from comment in context.TicketComments
                          where comment.TicketId == ticketId
                          select new GetTicketCommentDto
                          {
                              Id = comment.Id,
                              Content = comment.Content,
                              CreatedAt = comment.CreatedAt,
                              UpdatedAt = comment.UpdatedAt,
                              User = context.Users.Where(u => u.Id.Equals(comment.UserId)).Select(user => new TicketCommentUserDto
                              {
                                  Id = user.Id,
                                  Name = user.Name,
                                  ImageUrl = user.ImageUrl,
                                  IsActive = user.IsActive
                              }).SingleOrDefault()!,
                              ticketCommentReplies = context.TicketCommentReplies.Where(t => t.TicketCommentId.Equals(comment.Id)).Select(reply => new GetTicketCommentReplyDto
                              {
                                  Id = reply.Id,
                                  Content = reply.Content,
                                  CreatedAt = reply.CreatedAt,
                                  UpdatedAt = reply.UpdatedAt,
                                  User = context.Users.Where(u => u.Id.Equals(reply.UserId)).Select(user => new TicketCommentUserDto
                                  {
                                      Id = user.Id,
                                      Name = user.Name,
                                      ImageUrl = user.ImageUrl,
                                      IsActive = user.IsActive
                                  }).SingleOrDefault()!,
                              }).ToList(),

                          }
                          ).ToList();

            return result;
        }
    }
}
