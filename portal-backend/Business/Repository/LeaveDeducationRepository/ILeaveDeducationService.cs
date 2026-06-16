using Core.Utilities.Results.Abstract;
using Entities.Concrete;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Business.Repository.LeaveDeducationRepository
{
    public interface ILeaveDeducationService
    {
        IResult Add(LeaveDeducation leaveDeducation);
        IResult Update(LeaveDeducation leaveDeducation);
        IDataResult<List<LeaveDeducation>> GetAll();
        IResult Delete(int id);
        IResult GetByPermissionType(string permissionType);
    }
}
