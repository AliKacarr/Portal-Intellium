using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;
using Entities.DTOs.NewsCommentDtos;

namespace DataAccess.Repository.NewsCommentRepository
{
    public class EfNewsCommentDal : EfEntityRepositoryBase<NewsComment, PortalContext>, INewsCommentDal
    {
        public List<GetNewsCommentDto> GetCommentsByNewsId(long newsId)
        {
            using var context = new PortalContext();

            var allComments = context.NewsComments
                .Where(c => c.NewsId == newsId && c.IsActive)
                .Join(context.Users, c => c.UserId, u => u.Id,
                    (c, u) => new GetNewsCommentDto
                    {
                        Id = c.Id,
                        Content = c.Content,
                        NewsId = c.NewsId,
                        UserId = c.UserId,
                        UserName = u.Name,
                        ParentCommentId = c.ParentCommentId,
                        CreatedAt = c.CreatedAt
                    })
                .OrderBy(c => c.CreatedAt)
                .ToList();

            // Ağaç yapısı: üst düzey yorumların altına yanıtları ekle
            var rootComments = allComments.Where(c => c.ParentCommentId == null).ToList();
            foreach (var root in rootComments)
                root.Replies = allComments.Where(c => c.ParentCommentId == root.Id).ToList();

            return rootComments;
        }
    }
}
