using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Repository.PermissionRepository
{
    public class EfPermissionDal : EfEntityRepositoryBase<Permission, PortalContext>, IPermissionDal
    {
        public List<Permission> GetByPermissionType(string permissionType)
        {
            using (var context = new PortalContext())
            {
                var typeIds = context.PermissionTypes
                    .Where(x => x.Permission == permissionType || x.SubPermission == permissionType)
                    .Select(x => x.Id)
                    .ToList();

                var result = context.Permissions
                    .Where(permission => typeIds.Contains(permission.PermissionTypeId))
                    .ToList();

                return result;
            }
        }
        public Permission GetById(int id)
        {
            using (var context = new PortalContext())
            {
                var result = (from permission in context.Permissions where permission.Id == id select permission).SingleOrDefault();

                return result;
            }

        }

        public List<Permission> GetPermissionByUserId(long userId)
        {
            using (var context = new PortalContext())
            {
                var result = (from permission in context.Permissions where permission.UserId == userId select permission).ToList();
                return result;
            }
        }
    }
}
