using Core.Utilities.Results.Abstract;
using Entities.DTOs.NewsDtos;
using Entities.DTOs.UserDtos;

namespace Business.Repository.NewsRepository
{
    public interface INewsService
    {
        IDataResult<List<NewsListDto>> GetAll(bool publishedOnly = true);
        IDataResult<GetNewsDto> GetById(long id);
        IDataResult<List<NewsListDto>> GetByDepartment(long departmentId);
        IResult Add(AddNewsDto dto);
        IResult Update(UpdateNewsDto dto);
        IResult Delete(long id);
        IResult IncrementViewCount(long id);
        IDataResult<List<ViewerDto>> GetViewers(long id);
    }
}
