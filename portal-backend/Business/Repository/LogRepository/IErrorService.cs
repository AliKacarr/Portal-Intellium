using Core.Utilities.Results.Abstract;
using Entities.Concrete.Logs;
using Entities.DTOs.LogDtos;

namespace Business.Repository.LogRepository
{
	public interface IErrorService
	{
		public IDataResult<List<ErrorDto>> GetAllErrors();
		public IDataResult<List<ErrorType>> GetErrorTypes();
		public IDataResult<List<ErrorDto>> GetAllByErrorType(long errorTypeId);
		public IDataResult<List<ErrorDto>> GetInternalServerError();
		public IDataResult<StackTrace> GetStackTrace(long stackTraceId);
		public Task<IResult> GetFilteredErrorsAsync(ErrorFilterDto filterDto);
	}
}
