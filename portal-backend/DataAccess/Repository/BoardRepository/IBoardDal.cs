using Core.DataAccess;
using Entities.Concrete;
using Entities.DTOs.BoardDtos;

namespace DataAccess.Repository.BoardRepository
{
    public interface IBoardDal : IEntityRepository<Board>
    {
        List<BoardDto> GetAllBoardsByUser(long userId);
        List<BoardDto> GetAllBoards();
		List<BasicBoardDto> GetAllBasicBoardsByUser(long userId);
		List<BasicBoardDto> GetAllBasicBoards();
		BoardDto GetBoard(int boardId);
		Board GetBoardByTaskId(int taskId);
		bool CanUserAccessToBoard(int boardId, long userId);
	}
}
