using Core.Utilities.Results.Abstract;
using Entities.DTOs.LogDtos;

namespace Business.Repository.LogRepository
{
	public interface ISessionService
	{
		public IDataResult<List<SessionDto>> GetAllSession();
		public IDataResult<List<SessionDto>> GetSessionsByUserId(long userID);
		public IDataResult<List<SessionDto>> GetNotVerifiedSession();
		public IDataResult<List<SessionDto>> GetAllFailLoginByUserId(long userID);
		public Task<IResult> GetFilteredSessionsAsync(SessionFilterDto filterDto);
	}
}
