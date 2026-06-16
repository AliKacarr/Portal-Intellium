using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;

namespace DataAccess.Repository.BoardRepository
{
    public class EfBoardCategoryDal : EfEntityRepositoryBase<BoardCategory, PortalContext>, IBoardCategoryDal
    {
    }
}
