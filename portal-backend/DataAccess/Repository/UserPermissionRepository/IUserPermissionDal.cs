using Core.DataAccess;
using Entities.Concrete;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Repository.UserPermissionRepository
{
    public interface IUserPermissionDal : IEntityRepository<UserPermission>
    {
        UserPermission GetUserPermissionByUserId(long id);
    }
}
