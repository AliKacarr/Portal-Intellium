using Business.BusinessAspects;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.LogRepository;
using DataAccess.Repository.UserRepository;
using Entities.DTOs.LogDtos;

namespace Business.Repository.LogRepository
{
	public class SessionManager : ISessionService
	{
		private readonly IUserDal _userDal;
		private readonly ISessionDal _sessionDal;
		private readonly IUserActivityDal _activityDal;
		private readonly IRequestUrlDal _requestUrlDal;

		public SessionManager(IUserDal userDal, ISessionDal sessionDal, IUserActivityDal activityDal, IRequestUrlDal requestUrlDal)
		{
			_userDal = userDal;
			_sessionDal = sessionDal;
			_activityDal = activityDal;
			_requestUrlDal = requestUrlDal;
		}

		[SecuredOperation("admin")]
		public IDataResult<List<SessionDto>> GetAllFailLoginByUserId(long userId)
		{
			string mail = _userDal.Get(user => user.Id == userId).Email;
			long urlID = _requestUrlDal.Get(url => url.Url == "/api/Auth/login").Id;
			var failLoginActivities = _activityDal.GetAll(a => a.StatusCode == 400 && a.RequestUrlId == urlID && a.Payload.ToLower().Contains(mail));
			if (failLoginActivities.Any())
			{
				var idList = new List<long>();
				failLoginActivities.ForEach(activity =>
				{
					idList.Add(activity.SessionId);
				});
				var uniqueList = new HashSet<long>(idList).ToList();
				var dtoList = new List<SessionDto>();
				uniqueList.ForEach(id =>
				{
					var temp = _sessionDal.GetForDTO(s => s.Id == id);
					dtoList.Add(temp);
				});
				return new SuccessDataResult<List<SessionDto>>(dtoList);
			}
			else
			{
				return new ErrorDataResult<List<SessionDto>>("Hatalı giriş işlemi yapılan oturum bulunamadı");
			}
		}

		[SecuredOperation("admin")]
		public async Task<IResult> GetFilteredSessionsAsync(SessionFilterDto filterDto)
		{
			return await _sessionDal.GetFilteredSessionsAsync(filterDto);
		}

		[SecuredOperation("admin")]
		public IDataResult<List<SessionDto>> GetAllSession()
		{
			var data = _sessionDal.GetAllForDTO();
			if (data.Any())
			{
				return new SuccessDataResult<List<SessionDto>>(data);
			}
			else { return new ErrorDataResult<List<SessionDto>>("Oturum Bulunamadı"); }
		}

		[SecuredOperation("admin")]
		public IDataResult<List<SessionDto>> GetNotVerifiedSession()
		{
			var data = _sessionDal.GetAllForDTO(session => session.Verified == false);
			if (data.Any())
			{
				return new SuccessDataResult<List<SessionDto>>(data);
			}
			else { return new ErrorDataResult<List<SessionDto>>("Oturum Bulunamadı"); }
		}

		[SecuredOperation("admin")]
		public IDataResult<List<SessionDto>> GetSessionsByUserId(long userId)
		{
			var data = _sessionDal.GetAllForDTO(session => session.UserId == userId);
			if (data.Any())
			{
				return new SuccessDataResult<List<SessionDto>>(data);
			}
			else { return new ErrorDataResult<List<SessionDto>>("Oturum Bulunamadı"); }
		}
	}
}

