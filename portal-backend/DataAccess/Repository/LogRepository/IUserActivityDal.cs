using Core.DataAccess;
using Core.Utilities.Results.Abstract;
using Entities.Concrete.Logs;
using Entities.DTOs.LogDtos;
using System.Linq.Expressions;

namespace DataAccess.Repository.LogRepository
{
	public interface IUserActivityDal : IEntityRepository<UserActivity>
	{
		public long AddForError(UserActivity userActivity);
		public List<UserActivityDto> GetAllForDTO(Expression<Func<UserActivity, bool>>? filter = null);
		public UserActivityDto GetForDto(Expression<Func<UserActivity, bool>> filter);
		public Task<IResult> GetFilteredActivitiesAsync(UserActivityFilterDto filterDto);
	}
}
