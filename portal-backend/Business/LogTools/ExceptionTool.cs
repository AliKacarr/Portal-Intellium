using Core.Utilities.Exceptions;
using DataAccess.Repository.LogRepository;
using Entities.Concrete.Logs;
using System.Security.Cryptography;
using System.Text;

namespace Business.LogTools
{
	public class ExceptionTool : IExceptionProvider
	{
		private readonly IErrorDal _errorDal;
		private readonly IErrorTypeDal _errorTypeDal;
		private readonly IErrorMessageDal _errorMessageDal;
		private readonly IStackTraceDal _stackTraceDal;
		public ExceptionTool(IErrorDal errorDal, IErrorTypeDal errorTypeDal, IErrorMessageDal errorMessageDal, IStackTraceDal stackTraceDal)
		{
			_errorDal = errorDal;
			_errorTypeDal = errorTypeDal;
			_errorMessageDal = errorMessageDal;
			_stackTraceDal = stackTraceDal;
		}

		public int GetStatusCode(Exception exception)
		{
			if (exception is UnauthorizedAccessException || exception.Message.Contains("401")) return 401;
			else if (exception is ForbiddenAccessException || exception.Message.Contains("403")) return 403;
			else return 500;
		}

		public void SaveError(Exception exception, long ActivityId)
		{
			Error error = new();
			error.ActivityId = ActivityId;

			if (exception.GetType().Name != null)
			{
				ErrorType errorType = new();
				errorType.Type = exception.GetType().Name;
				error.TypeId = _errorTypeDal.AddForError(errorType);
			}
			else
			{
				error.TypeId = 0;
			}
			if (exception.StackTrace != null)
			{
				StackTrace stackTrace = new StackTrace();
				stackTrace.ErrorStackTrace = exception.StackTrace;
				stackTrace.STHash = BitConverter.ToString(SHA256.HashData(Encoding.UTF8.GetBytes(exception.StackTrace))).Replace("-", "").ToLower();
				error.StackTraceId = _stackTraceDal.AddForError(stackTrace);

			}
			else
			{
				error.StackTraceId = 0;
			}
			if (exception.Message != null)
			{
				ErrorMessage errorMessage = new();
				errorMessage.Id = 0;
				errorMessage.Message = exception.Message;
				error.MessageId = _errorMessageDal.AddForError(errorMessage);
			}
			else
			{
				error.MessageId = 0;
			}
			_errorDal.Add(error);
		}
	}
}
