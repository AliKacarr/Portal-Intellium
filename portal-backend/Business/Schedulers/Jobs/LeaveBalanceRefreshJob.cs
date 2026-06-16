using Business.Helpers;
using DataAccess.Repository.UserJobDetailRepository;
using DataAccess.Repository.UserPermissionRepository;
using DataAccess.Repository.UserProfileDetailRepository;
using DataAccess.Repository.UserRepository;
using Quartz;

namespace Business.Schedulers.Jobs
{
    public class LeaveBalanceRefreshJob : IJob
    {
        private readonly IUserDal _userDal;
        private readonly IUserPermissionDal _userPermissionDal;
        private readonly IUserProfileDetailDal _userProfileDetailDal;
        private readonly IUserJobDetailDal _userJobDetailDal;

        public LeaveBalanceRefreshJob(
            IUserDal userDal,
            IUserPermissionDal userPermissionDal,
            IUserProfileDetailDal userProfileDetailDal,
            IUserJobDetailDal userJobDetailDal)
        {
            _userDal = userDal;
            _userPermissionDal = userPermissionDal;
            _userProfileDetailDal = userProfileDetailDal;
            _userJobDetailDal = userJobDetailDal;
        }

        public System.Threading.Tasks.Task Execute(IJobExecutionContext context)
        {
            DateTime now = DateTime.Now;
            var users = _userDal.GetAll();

            foreach (var user in users)
            {
                var jobDetail = _userJobDetailDal.Get(j => j.UserId == user.Id);
                if (jobDetail?.StartDate == null) continue;

                DateTime startDate = jobDetail.StartDate.Value;
                bool isWorkAnniversaryToday = IsSameDayOrLeapDayObserved(startDate, now);
                if (!isWorkAnniversaryToday) continue;

                var profile = _userProfileDetailDal.Get(p => p.UserId == user.Id);
                DateTime birthDate = profile?.BirthDate ?? default;
                int newThisYearLeave = UserPermissionCalculate.CalculateThisYearLeave(startDate, birthDate, now);
                int newTotalLeave = UserPermissionCalculate.CalculateTotalLeave(startDate, birthDate, now);

                var permission = _userPermissionDal.GetUserPermissionByUserId(user.Id);
                if (permission == null)
                {
                    _userPermissionDal.Add(new Entities.Concrete.UserPermission
                    {
                        UserId = user.Id,
                        ThisYear = newThisYearLeave,
                        TotalLeave = newTotalLeave,
                        UsedLeave = 0,
                        RemainingLeave = newTotalLeave,
                        Year = now.Year
                    });
                    continue;
                }

                permission.ThisYear = newThisYearLeave;
                permission.TotalLeave = newTotalLeave;
                permission.RemainingLeave += newThisYearLeave;
                permission.Year = now.Year;
                _userPermissionDal.Update(permission);
            }

            return System.Threading.Tasks.Task.CompletedTask;
        }

        private static bool IsSameDayOrLeapDayObserved(DateTime sourceDate, DateTime today)
        {
            if (sourceDate.Month == today.Month && sourceDate.Day == today.Day)
                return true;

            // 29 Subat tarihi, artik olmayan yillarda 1 Mart'ta isletilir.
            if (sourceDate.Month == 2 && sourceDate.Day == 29 &&
                today.Month == 3 && today.Day == 1 &&
                !DateTime.IsLeapYear(today.Year))
                return true;

            return false;
        }
    }
}
