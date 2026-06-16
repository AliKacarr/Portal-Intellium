using Core.DataAccess;
using Entities.Concrete;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Repository.PermissionRepository
{
    public interface IPermissionDal: IEntityRepository<Permission>
    {
        List<Permission> GetByPermissionType( string permissionType);
        Permission GetById(int id);
        List<Permission> GetPermissionByUserId(long userId);

    }
}
