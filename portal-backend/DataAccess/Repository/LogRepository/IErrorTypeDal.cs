using Core.DataAccess;
using Entities.Concrete.Logs;

namespace DataAccess.Repository.LogRepository
{
	public interface IErrorTypeDal : IEntityRepository<ErrorType>
	{
		public long AddForError(ErrorType errorType);
	}
}
