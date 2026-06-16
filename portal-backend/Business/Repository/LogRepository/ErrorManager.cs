using Business.BusinessAspects;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.LogRepository;
using Entities.Concrete.Logs;
using Entities.DTOs.LogDtos;

namespace Business.Repository.LogRepository
{
	public class ErrorManager : IErrorService
	{
		private readonly IErrorTypeDal _errorTypeDal;
		private readonly IErrorDal _errorDal;
		private readonly IStackTraceDal _stackTraceDal;
		private readonly IUserActivityDal _userActivityDal;

		public ErrorManager(IErrorTypeDal errorTypeDal, IErrorDal errorDal, IStackTraceDal stackTraceDal, IUserActivityDal userActivityDal)
		{
			_errorTypeDal = errorTypeDal;
			_errorDal = errorDal;
			_stackTraceDal = stackTraceDal;
			_userActivityDal = userActivityDal;
		}

		[SecuredOperation(RoleNames.Admin)]
		public async Task<IResult> GetFilteredErrorsAsync(ErrorFilterDto filterDto)
		{
			return await _errorDal.GetFilteredErrorsAsync(filterDto);
		}

		[SecuredOperation(RoleNames.Admin)]
		public IDataResult<List<ErrorDto>> GetAllByErrorType(long errorTypeId)
		{
			var data = _errorDal.GetAllForDTO(err => err.TypeId == errorTypeId);
			return data.Any()
				? new SuccessDataResult<List<ErrorDto>>(data)
				: new ErrorDataResult<List<ErrorDto>>("Belirtilen tipte hata bulunamadı");
		}

		[SecuredOperation(RoleNames.Admin)]
		public IDataResult<List<ErrorDto>> GetAllErrors()
		{
			var data = _errorDal.GetAllForDTO();
			return data.Any() 
				? new SuccessDataResult<List<ErrorDto>>(data)
				: new ErrorDataResult<List<ErrorDto>>("Belirtilen tipte hata bulunamadı");
		}

		[SecuredOperation(RoleNames.Admin)]
		public IDataResult<List<ErrorType>> GetErrorTypes()
		{
			var data = _errorTypeDal.GetAll();
			return data.Any() 
				? new SuccessDataResult<List<ErrorType>>(data)
				: new ErrorDataResult<List<ErrorType>>("Error tipi bulunamadı");
		}

		[SecuredOperation(RoleNames.Admin)]
		public IDataResult<List<ErrorDto>> GetInternalServerError()
		{
			var data = _userActivityDal.GetAll(activity => activity.StatusCode == 500);
			if (data.Any())
			{
				var list = new List<ErrorDto>();
				data.ForEach(ac =>
				{
					var errordto = _errorDal.GetForDTO(error => error.ActivityId == ac.Id);
					list.Add(errordto);
				});
				return new SuccessDataResult<List<ErrorDto>>(list);
			}
			else
			{
				return new ErrorDataResult<List<ErrorDto>>("Bu tipte Hata bulunamadı");
			}
		}

		[SecuredOperation(RoleNames.Admin)]
		public IDataResult<StackTrace> GetStackTrace(long stackTraceId)
		{
			var data = _stackTraceDal.Get(st => st.Id == stackTraceId);
			return (data != null)
				? new SuccessDataResult<StackTrace>(data)
				: new ErrorDataResult<StackTrace>("Bulunamadı");
		}
	}
}
