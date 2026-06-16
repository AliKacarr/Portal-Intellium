using Core.DataAccess;
using Core.Utilities.Results.Abstract;
using Entities.Concrete.Logs;
using Entities.DTOs.LogDtos;
using System.Linq.Expressions;

namespace DataAccess.Repository.LogRepository
{
	public interface IErrorDal : IEntityRepository<Error>
	{
		public List<ErrorDto> GetAllForDTO(Expression<Func<Error, bool>>? filter = null);
		public ErrorDto GetForDTO(Expression<Func<Error, bool>>? filter);
		public Task<IResult> GetFilteredErrorsAsync(ErrorFilterDto filterDto);
	}
}
