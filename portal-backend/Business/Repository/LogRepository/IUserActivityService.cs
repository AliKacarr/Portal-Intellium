using Core.Utilities.Results.Abstract;
using Entities.DTOs.LogDtos;

namespace Business.Repository.LogRepository
{
	public interface IUserActivityService
	{
		public IDataResult<UserActivityDto> GetActivity(long ActivityId);
		public IDataResult<List<UserActivityDto>> GetAllActiviesByUserId(long UserId);
		public IDataResult<List<UserActivityDto>> GetAllSuccessActivitiesByUserID(long UserId);
		public IDataResult<List<UserActivityDto>> GetAllFailActivitiesByUserID(long UserId);
		public IDataResult<List<UserActivityDto>> GetUnauthorizedActivities();
		public IDataResult<List<UserActivityDto>> GetForbiddenActivities();
		public IDataResult<List<UserActivityDto>> GetAllActivities();
		public Task<IResult> GetFilteredActivitiesAsync(UserActivityFilterDto filterDto);
	}
}
