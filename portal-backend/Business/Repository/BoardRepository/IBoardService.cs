using Core.Utilities.Results.Abstract;
using Entities.DTOs.BoardDtos;

namespace Business.Repository.BoardRepository
{
    public interface IBoardService
    {
        IResult Add(AddBoardDto addBoardDto);
        IResult Delete(int boardId);
        IResult Update(EditBoardDto board);
        IDataResult<List<BoardDto>> GetAll();
		IDataResult<List<BasicBoardDto>> GetAllBasic();
		IDataResult<BoardDto> Get(int boardId);
        IDataResult<List<BoardWithTaskListsDto>> GetAllWithTaskListsByEmail(string email);
    }
}
