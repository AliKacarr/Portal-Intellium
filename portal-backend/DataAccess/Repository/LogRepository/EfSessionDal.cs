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
	public class EfSessionDal : EfEntityRepositoryBase<Session, PortalLogContext>, ISessionDal
	{
		public long AddForFail(Session session)
		{
			using var context = new PortalLogContext();
			var temp = context.Set<Session>().FirstOrDefault(s => !s.Verified && s.SessionHash == session.SessionHash);
			if (temp != null)
			{
				return temp.Id;
			}
			else
			{
				session.Verified = false;
				var addedEntity = context.Entry(session);
				addedEntity.State = EntityState.Added;
				context.SaveChanges();
				temp = context.Set<Session>().FirstOrDefault(s => s.SessionHash == session.SessionHash);
				return temp.Id;
			}
		}

		public async Task<IResult> GetFilteredSessionsAsync(SessionFilterDto filterDto)
		{

			using var logContext = new PortalLogContext();
			var sessionsQuery = from session in logContext.Sessions
								select new SessionDto
								{
									Id = session.Id,
									UserId = session.UserId,
									Username = session.Username,
									Token = session.Token,
									IPAddress = session.IPAddress,
									UserAgent = session.UserAgent,
									Verified = session.Verified,
								};

			if (!string.IsNullOrEmpty(filterDto.Username))
			{
				sessionsQuery = sessionsQuery.Where(e => e.Username.ToLower().Contains(filterDto.Username.ToLower()));
			}
			if (filterDto.Verified.HasValue)
			{
				sessionsQuery = sessionsQuery.Where(e => e.Verified == filterDto.Verified);
			}

			int totalCount = await sessionsQuery.CountAsync();
			var sessions = await sessionsQuery
				.Skip((filterDto.Page - 1) * filterDto.Limit)
				.Take(filterDto.Limit)
				.ToListAsync();

			return sessions.Any()
				? new PaginatedResult<List<SessionDto>>(sessions, true)
				{
					PageNumber = filterDto.Page,
					PageSize = filterDto.Limit,
					TotalCount = totalCount
				}
				: new ErrorResult("Kayıt bulunamadı.");
		}


		public long AddForSuccesLogin(Session session)
		{
			using var context = new PortalLogContext();
			session.Verified = true;
			var addedEntity = context.Entry(session);
			addedEntity.State = EntityState.Added;
			context.SaveChanges();
			var temp = context.Set<Session>().FirstOrDefault(s => s.Token == session.Token);
			return temp.Id;
		}

		public long AddForTask(Session session)
		{

			using var context = new PortalLogContext();
			var temp = context.Set<Session>().FirstOrDefault(s => s.Token == session.Token && s.UserAgent == session.UserAgent);
			if (temp != null)
			{
				return temp.Id;
			}
			else
			{
				session.Verified = false;
				var addedEntity = context.Entry(session);
				addedEntity.State = EntityState.Added;
				context.SaveChanges();
				temp = context.Set<Session>().FirstOrDefault(s => s.Token == session.Token);
				return temp.Id;
			}
		}

		public List<SessionDto> GetAllForDTO(Expression<Func<Session, bool>>? filter = null)
		{
			using var context = new PortalLogContext();

			if (filter != null)
			{
				var data = context.Set<Session>().Where(filter).ToList();
				if (data.Any())
				{
					var list = new List<SessionDto>();
					data.ForEach(session =>
					{
						var temp = new SessionDto();
						temp.Id = session.Id;
						temp.IPAddress = session.IPAddress;
						temp.UserAgent = session.UserAgent;
						temp.Username = session.Username;
						temp.UserId = session.UserId;
						temp.Token = session.Token;
						temp.Verified = session.Verified;
						list.Add(temp);

					});

					return list;
				}
				else
				{
					return new List<SessionDto>();
				}
			}
			else
			{
				var data = context.Set<Session>().ToList();
				if (data.Any())
				{
					var list = new List<SessionDto>();
					data.ForEach(session =>
					{
						var temp = new SessionDto();
						temp.Id = session.Id;
						temp.IPAddress = session.IPAddress;
						temp.UserAgent = session.UserAgent;
						temp.Username = session.Username;
						temp.UserId = session.UserId;
						temp.Token = session.Token;
						temp.Verified = session.Verified;
						list.Add(temp);

					});

					return list;
				}
				else
				{
					return new List<SessionDto>();
				}
			}


		}

		public SessionDto GetForDTO(Expression<Func<Session, bool>>? filter)
		{
			using (var context = new PortalLogContext())
			{
				var session = context.Set<Session>().FirstOrDefault(filter);
				if (session != null)
				{
					var temp = new SessionDto();
					temp.Id = session.Id;
					temp.IPAddress = session.IPAddress;
					temp.UserAgent = session.UserAgent;
					temp.Username = session.Username;
					temp.UserId = session.UserId;
					temp.Token = session.Token;
					temp.Verified = session.Verified;
					return temp;
				}
				else
				{
					return new SessionDto();
				}
			}
		}
	}
}
