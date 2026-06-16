using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Repository.LeaveDeducationRepository
{
    public class EfLeaveDeducationDal : EfEntityRepositoryBase<LeaveDeducation, PortalContext>, ILeaveDeducationDal
    {
        public LeaveDeducation GetByPermissionType(string permissionType)
        {
            using (var context = new PortalContext())
            {
                var result = (from leaveDeduction in context.LeaveDeducations
                              where leaveDeduction.PermissionType == permissionType
                              select leaveDeduction).SingleOrDefault();
                return result;
            }
        }
    }
}
