using Core.Utilities.Results.Abstract;
using Entities.Concrete;

namespace Business.Repository.BoardCategoryRepository
{
    public interface IBoardCategoryService
    {
        IResult Add(BoardCategory boardCategory);

        IResult Delete(int boardCategoryId);

        IResult Update(BoardCategory boardCategory);

        IDataResult<List<BoardCategory>> GetAll();
        IDataResult<BoardCategory> GetById(int id);

    }
}
