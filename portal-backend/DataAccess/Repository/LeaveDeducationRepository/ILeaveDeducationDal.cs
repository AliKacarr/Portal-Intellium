using Core.DataAccess;
using Entities.Concrete;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Repository.LeaveDeducationRepository
{
    public interface ILeaveDeducationDal: IEntityRepository<LeaveDeducation>
    {
        LeaveDeducation GetByPermissionType(string permissionType);
    }
}
