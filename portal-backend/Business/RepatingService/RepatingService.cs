using Business.Helpers;
using DataAccess.Repository.UserJobDetailRepository;
using DataAccess.Repository.UserPermissionRepository;
using DataAccess.Repository.UserProfileDetailRepository;
using DataAccess.Repository.UserRepository;
using Entities.Concrete;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Task = System.Threading.Tasks.Task;

namespace Business
{
    public class RepatingService : BackgroundService
    {
        private ILogger<RepatingService> _logger;
        private readonly IUserPermissionDal _userPermissionDal;
        private readonly IUserDal _userDal;
        private readonly IUserProfileDetailDal _userDetailDal;
        private readonly IUserJobDetailDal _userJobDetailDal;

        public RepatingService(ILogger<RepatingService> logger, IUserPermissionDal userPermissionDal, IUserDal userDal, IUserProfileDetailDal userDetailDal, IUserJobDetailDal userJobDetailDal)
        {
            _logger = logger;
            _userPermissionDal = userPermissionDal;
            _userDal = userDal;
            _userDetailDal = userDetailDal;
            _userJobDetailDal = userJobDetailDal;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                var users = _userDal.GetAll();
                DateTime now = DateTime.Now;

                foreach (var user in users)
                {
                    var userProfileDetail = _userDetailDal.Get(u => u.UserId.Equals(user.Id)) ?? null;
                    if (userProfileDetail != null)
                    {
                        // İşe giriş tarihi artık UserJobDetail.StartDate'ten okunuyor
                        var jobDetail = _userJobDetailDal.Get(j => j.UserId == user.Id);
                        DateTime startDate = jobDetail?.StartDate ?? DateTime.MinValue;

                        // İşe giriş tarihi girilmemişse izin hesabı yapılmaz
                        if (startDate == DateTime.MinValue) continue;

                        if (startDate.Month == now.Month && startDate.Day == now.Day)
                        {
                            var userPermission = _userPermissionDal.Get(x => x.UserId == user.Id);
                            if (userPermission != null)
                            {
                                int newThisYearLeave = UserPermissionCalculate.CalculateThisYearLeave(startDate, userProfileDetail.BirthDate, now);
                                int newTotalLeave = UserPermissionCalculate.CalculateTotalLeave(startDate, userProfileDetail.BirthDate, now);
                                userPermission.ThisYear = newThisYearLeave;
                                userPermission.TotalLeave = newTotalLeave;
                                userPermission.RemainingLeave = userPermission.TotalLeave - userPermission.UsedLeave;
                                _userPermissionDal.Update(userPermission);
                            }
                        }
                    }
                }
                await Task.Delay(1000 * 60 * 60 * 24, stoppingToken);
            }
        }
    }
}
