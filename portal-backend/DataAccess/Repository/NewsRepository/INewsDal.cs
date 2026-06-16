using Core.DataAccess;
using Entities.Concrete;
using Entities.DTOs.NewsDtos;
using Entities.DTOs.UserDtos;

namespace DataAccess.Repository.NewsRepository
{
    public interface INewsDal : IEntityRepository<News>
    {
        List<NewsListDto> GetAllAsDto(bool publishedOnly = true);
        List<NewsListDto> GetAllAsDtoForPortalUser(bool publishedOnly, long userId);
        GetNewsDto GetByIdAsDto(long id);
        List<NewsListDto> GetByDepartment(long departmentId);
        void IncrementViewCount(long newsId);
        void RecordView(long newsId, long userId);
        List<ViewerDto> GetViewers(long newsId);
    }
}
