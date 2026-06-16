using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;

namespace DataAccess.Repository.RequestRepository
{
    public class EfRequestSubCategoryFieldDal : EfEntityRepositoryBase<RequestSubCategoryField, PortalContext>, IRequestSubCategoryFieldDal
    {
    }
}
