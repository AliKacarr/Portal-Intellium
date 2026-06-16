using Core.DataAccess;
using Core.Utilities.Results.Abstract;
using Entities.Concrete.Logs;
using Entities.DTOs.LogDtos;
using System.Linq.Expressions;

namespace DataAccess.Repository.LogRepository
{
	public interface ISessionDal : IEntityRepository<Session>
	{
		public long AddForTask(Session session);
		public long AddForSuccesLogin(Session session);
		public long AddForFail(Session session);
		public List<SessionDto> GetAllForDTO(Expression<Func<Session, bool>>? filter = null);
		public SessionDto GetForDTO(Expression<Func<Session, bool>>? filter);
		public Task<IResult> GetFilteredSessionsAsync(SessionFilterDto filterDto);
	}
}
