using Business.BusinessAspects;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.LogRepository;
using Entities.DTOs.LogDtos;

namespace Business.Repository.LogRepository
{
	public class UserActivityManager : IUserActivityService
	{
		private readonly IUserActivityDal _userActivityDal;
		private readonly ISessionDal _sessionDal;

		public UserActivityManager(IUserActivityDal userActivityDal, IUserContext userContext, ISessionDal sessionDal)
		{
			_userActivityDal = userActivityDal;
			_sessionDal = sessionDal;
		}

		[SecuredOperation("admin")]
		public async Task<IResult> GetFilteredActivitiesAsync(UserActivityFilterDto filterDto)
		{
			return await _userActivityDal.GetFilteredActivitiesAsync(filterDto);
		}

		[SecuredOperation("admin")]
		public IDataResult<List<UserActivityDto>> GetAllActivities()
		{
			var sessions = _sessionDal.GetAll();
			var list = new List<UserActivityDto>();
			sessions.ForEach(ses =>
			{
				var activities = _userActivityDal.GetAllForDTO(a => a.SessionId == ses.Id);
				if (activities.Any()) { list.AddRange(activities); }
			});

			return new SuccessDataResult<List<UserActivityDto>>(list);
		}

		[SecuredOperation("admin")]
		public IDataResult<UserActivityDto> GetActivity(long ActivityId)
		{
			var activity = _userActivityDal.GetForDto(x => x.Id == ActivityId);
			if (activity.Id != 0)
			{
				return new SuccessDataResult<UserActivityDto>(activity);
			}
			else
			{
				return new ErrorDataResult<UserActivityDto>("Aktivite Bulunamadı");
			}
		}

		[SecuredOperation("admin")]
		public IDataResult<List<UserActivityDto>> GetAllActiviesByUserId(long UserId)
		{
			var sessions = _sessionDal.GetAll(s => s.UserId == UserId);
			if (sessions.Any())
			{
				var list = new List<UserActivityDto>();
				sessions.ForEach(ses =>
				{
					var activities = _userActivityDal.GetAllForDTO(a => a.SessionId == ses.Id);
					if (activities.Any()) { list.AddRange(activities); }
				});
				if (list.Any())
				{
					return new SuccessDataResult<List<UserActivityDto>>(list);
				}
				else
				{
					return new ErrorDataResult<List<UserActivityDto>>("Kullanıcıya ait Aktivite bulunamadı");
				}
			}
			else
			{
				return new ErrorDataResult<List<UserActivityDto>>("Kullanıcıya ait Oturum bulunamadı");
			}
		}

		[SecuredOperation("admin")]
		public IDataResult<List<UserActivityDto>> GetAllFailActivitiesByUserID(long UserId)
		{
			var activities = _userActivityDal.GetAllForDTO(a => a.StatusCode == 400);
			if (activities.Any())
			{
				return new SuccessDataResult<List<UserActivityDto>>(activities);
			}
			else
			{
				return new ErrorDataResult<List<UserActivityDto>>("İşlemler bulunamadı");
			}
		}

		[SecuredOperation("admin")]
		public IDataResult<List<UserActivityDto>> GetAllSuccessActivitiesByUserID(long UserId)
		{
			var activities = _userActivityDal.GetAllForDTO(a => a.StatusCode == 200);
			if (activities.Any())
			{
				return new SuccessDataResult<List<UserActivityDto>>(activities);
			}
			else
			{
				return new ErrorDataResult<List<UserActivityDto>>("İşlemler bulunamadı");
			}
		}

		[SecuredOperation("admin")]
		public IDataResult<List<UserActivityDto>> GetForbiddenActivities()
		{
			var activities = _userActivityDal.GetAllForDTO(a => a.StatusCode == 403);
			if (activities.Any())
			{
				return new SuccessDataResult<List<UserActivityDto>>(activities);
			}
			else
			{
				return new ErrorDataResult<List<UserActivityDto>>("İşlemler bulunamadı");
			}
		}

		[SecuredOperation("admin")]
		public IDataResult<List<UserActivityDto>> GetUnauthorizedActivities()
		{
			var activities = _userActivityDal.GetAllForDTO(a => a.StatusCode == 401);
			if (activities.Any())
			{
				return new SuccessDataResult<List<UserActivityDto>>(activities);
			}
			else
			{
				return new ErrorDataResult<List<UserActivityDto>>("İşlemler bulunamadı");
			}
		}
	}
}
