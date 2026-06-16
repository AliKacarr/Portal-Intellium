using DataAccess.Repository.LeaveDeducationRepository;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Business.Helpers
{
    public class LeaveDeducationHelpers
    {
        private readonly ILeaveDeducationDal _leaveDeducationDal;

        public LeaveDeducationHelpers(ILeaveDeducationDal leaveDeducationDal)
        {
            _leaveDeducationDal = leaveDeducationDal;
        }
        public bool IsPermissionWithinDeductionRange(string permissionType, DateTime startTime, DateTime endTime)
        {
            var leaveDeducations = _leaveDeducationDal.GetByPermissionType(permissionType);


            if (leaveDeducations != null)
            {
                int maxDays = leaveDeducations.MaxDay;
                int totalDays = (endTime - startTime).Days + 1;
                return totalDays <= maxDays;
            }

            return true;
        }

    }
}
