using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;
using Entities.DTOs.BoardMemberDtos;

namespace DataAccess.Repository.BoardRepository
{
    public class EfBoardMemberDal : EfEntityRepositoryBase<BoardMember, PortalContext>, IBoardMemberDal
    {
        public List<BoardMemberDto> GetAllByBoardIdWithUsers(int boardId)
        {
            using (var context = new PortalContext())
            {
                var result = (from boardMember in context.BoardMembers where boardMember.BoardId == boardId
                              join user in context.Users on boardMember.UserId equals user.Id
                              select new BoardMemberDto
                              {
                                  Id = boardMember.Id,
                                  UserId = user.Id,
                                  Name = user.Name,
                                  Email = user.Email,
                                  ImageUrl = user.ImageUrl
                              }).ToList();
                return result;
            }
        }
    }
}
