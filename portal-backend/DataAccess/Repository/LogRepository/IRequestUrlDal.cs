using Core.DataAccess;
using Entities.Concrete.Logs;

namespace DataAccess.Repository.LogRepository
{
	public interface IRequestUrlDal : IEntityRepository<RequestUrl>
	{
		public long AddForUserActivity(RequestUrl requestUrl);
	}
}
