using Core.DataAccess.EntityFramework;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Concrete.EntityFramework.Context;
using DataAccess.Repository.LogRepository;
using Entities.Concrete.Logs;
using Entities.DTOs.LogDtos;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace DataAccess.Repository.LogRepositroy
{
	public class EfUserActivityDal : EfEntityRepositoryBase<UserActivity, PortalLogContext>, IUserActivityDal
	{
		public long AddForError(UserActivity userActivity)
		{
			using var context = new PortalLogContext();
			var addedEntity = context.Entry(userActivity);
			addedEntity.State = EntityState.Added;
			context.SaveChanges();
			var temp = context.Set<UserActivity>().FirstOrDefault(activity => activity.SessionId == userActivity.SessionId && activity.RequestUrlId == userActivity.RequestUrlId && activity.Time == userActivity.Time && activity.StatusCode == userActivity.StatusCode);
			return temp.Id;
		}

		public async Task<IResult> GetFilteredActivitiesAsync(UserActivityFilterDto filterDto)
		{
			using var context = new PortalLogContext();
			var query = from activity in context.UserActivityLogs
						join requestUrl in context.RequestUrl
							on activity.RequestUrlId equals requestUrl.Id
						select new GetUserActivityDto
						{
							Id = activity.Id,
							SessionId = activity.SessionId,
							Time = activity.Time,
							StatusCode = activity.StatusCode,
							RequestUrl = requestUrl.Url,
							Payload = activity.Payload,
							Response = activity.Response
						};


			if (!string.IsNullOrEmpty(filterDto.RequestUrl))
			{
				query = query.Where(a => a.RequestUrl.Contains(filterDto.RequestUrl));
			}

			if (filterDto.StartDate.HasValue && filterDto.EndDate.HasValue)
			{
				query = query.Where(a => a.Time >= filterDto.StartDate.Value && a.Time <= filterDto.EndDate.Value);
			}

			if (filterDto.StatusCode.HasValue)
			{
				query = query.Where(a => a.StatusCode == filterDto.StatusCode.Value);
			}

			int totalCount = await query.CountAsync();
			var activities = await query
				.OrderByDescending(a => a.Time)
				.Skip((filterDto.Page - 1) * filterDto.Limit)
				.Take(filterDto.Limit)
				.ToListAsync();


			return activities.Any()
				? new PaginatedResult<List<GetUserActivityDto>>(activities, true)
				{
					PageNumber = filterDto.Page,
					PageSize = filterDto.Limit,
					TotalCount = totalCount
				}
				: new ErrorResult("Kayıt bulunamadı.");
		}

		public List<UserActivityDto> GetAllForDTO(Expression<Func<UserActivity, bool>>? filter = null)
		{

			using var context = new PortalLogContext();
			if (filter != null)
			{
				var data = context.Set<UserActivity>().Where(filter).ToList();
				if (data.Any())
				{
					var list = new List<UserActivityDto>();
					data.ForEach(d =>
					{
						var temp = new UserActivityDto();
						temp.Id = d.Id;
						if (d.RequestUrlId != 0) { temp.RequestUrl = context.Set<RequestUrl>().FirstOrDefault(x => x.Id == d.RequestUrlId).Url; }
						temp.Payload = d.Payload;
						temp.Time = d.Time;
						temp.StatusCode = d.StatusCode;
						temp.Response = d.Response;
						if (d.SessionId != 0) { temp.Session = context.Set<Session>().FirstOrDefault(x => x.Id == d.SessionId); }
						list.Add(temp);
					});
					return list;
				}
				else
				{
					return new List<UserActivityDto>();
				}
			}
			else
			{
				var data = context.Set<UserActivity>().ToList();
				if (data.Any())
				{
					var list = new List<UserActivityDto>();
					data.ForEach(d =>
					{
						var temp = new UserActivityDto();
						temp.Id = d.Id;
						if (d.RequestUrlId != 0) { temp.RequestUrl = context.Set<RequestUrl>().FirstOrDefault(x => x.Id == d.RequestUrlId).Url; }
						temp.Payload = d.Payload;
						temp.Time = d.Time;
						temp.StatusCode = d.StatusCode;
						temp.Response = d.Response;
						if (d.SessionId != 0) { temp.Session = context.Set<Session>().FirstOrDefault(x => x.Id == d.SessionId); }
						list.Add(temp);
					});
					return list;
				}
				else
				{
					return new List<UserActivityDto>();
				}
			}
		}

		public UserActivityDto GetForDto(Expression<Func<UserActivity, bool>> filter)
		{
			using var context = new PortalLogContext();
			var data = context.Set<UserActivity>().FirstOrDefault(filter);
			var temp = new UserActivityDto();
			if (data != null)
			{
				temp.Id = data.Id;
				if (data.RequestUrlId != 0) { temp.RequestUrl = context.Set<RequestUrl>().FirstOrDefault(x => x.Id == data.RequestUrlId).Url; }
				temp.Payload = data.Payload;
				temp.Time = data.Time;
				temp.StatusCode = data.StatusCode;
				temp.Response = data.Response;
				if (data.SessionId != 0) { temp.Session = context.Set<Session>().FirstOrDefault(x => x.Id == data.SessionId); }
			}
			return temp;
		}
	}
}
