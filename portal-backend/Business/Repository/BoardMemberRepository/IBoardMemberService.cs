using Core.Utilities.Results.Abstract;
using Entities.Concrete;
using Entities.DTOs.BoardMemberDtos;

namespace Business.Repository.BoardMemberRepository
{
    public interface IBoardMemberService
    {
        IResult Add(AddBoardMembersDto boardMembers);
        IResult Delete(int boardMemberId);
        IResult DeleteAll(List<BoardMember> boardMembers);
        IDataResult<List<BoardMember>> GetAllByBoardId(int boardId);
        IDataResult<List<BoardMemberDto>> GetAllByBoardIdWithUsers(int boardId);

    }
}
