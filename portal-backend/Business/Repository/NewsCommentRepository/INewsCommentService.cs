using Core.Utilities.Results.Abstract;
using Entities.DTOs.NewsCommentDtos;

namespace Business.Repository.NewsCommentRepository
{
    public interface INewsCommentService
    {
        IDataResult<List<GetNewsCommentDto>> GetByNewsId(long newsId);
        IResult Add(AddNewsCommentDto dto);
        IResult Delete(long id);
    }
}
