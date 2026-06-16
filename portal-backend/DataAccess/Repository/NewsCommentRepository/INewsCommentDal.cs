using Core.DataAccess;
using Entities.Concrete;
using Entities.DTOs.NewsCommentDtos;

namespace DataAccess.Repository.NewsCommentRepository
{
    public interface INewsCommentDal : IEntityRepository<NewsComment>
    {
        List<GetNewsCommentDto> GetCommentsByNewsId(long newsId);
    }
}
