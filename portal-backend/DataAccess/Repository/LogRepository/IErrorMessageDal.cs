using Core.DataAccess;
using Entities.Concrete.Logs;

namespace DataAccess.Repository.LogRepository
{
	public interface IErrorMessageDal : IEntityRepository<ErrorMessage>
	{
		public long AddForError(ErrorMessage errorMessage);
	}
}
