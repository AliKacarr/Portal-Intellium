using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;

namespace DataAccess.Repository.NewsCategoryRepository
{
    public class EfNewsCategoryDal : EfEntityRepositoryBase<NewsCategory, PortalContext>, INewsCategoryDal
    {
    }
}
