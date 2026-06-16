using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;

namespace DataAccess.Repository.RolesForUsersRepository
{
    public class EfRolesForUsersDal : EfEntityRepositoryBase<RolesForUsers, PortalContext>, IRolesForUsersDal
    {

    }
}
