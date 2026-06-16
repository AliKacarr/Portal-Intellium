using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;

namespace DataAccess.Repository.PermissionTypeRepository
{
    public class EfPermissionTypeDal : EfEntityRepositoryBase<PermissionTypes, PortalContext>, IPermissionTypeDal
    {
    }
}
