using Core.DataAccess;
using Entities.Concrete.Logs;

namespace DataAccess.Repository.LogRepository
{
	public interface IStackTraceDal : IEntityRepository<StackTrace>
	{
		public long AddForError(StackTrace stackTrace);
	}
}
