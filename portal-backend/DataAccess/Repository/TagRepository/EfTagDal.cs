using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;

namespace DataAccess.Repository.TagRepository
{
    public class EfTagDal : EfEntityRepositoryBase<Tag, PortalContext>, ITagDal
    {
    }
}
