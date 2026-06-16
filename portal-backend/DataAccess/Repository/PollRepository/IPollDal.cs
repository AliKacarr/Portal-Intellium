using Core.DataAccess;
using Entities.Concrete;
using Entities.DTOs.PollDtos;

namespace DataAccess.Repository.PollRepository
{
    public interface IPollDal : IEntityRepository<Poll>
    {
        List<PollListDto> GetAllAsDto(long currentUserId);
        List<PollListDto> GetAllAsDtoForPortalUser(long userId);
        GetPollDto GetByIdAsDto(long pollId, long currentUserId);
        List<PollListDto> GetActivePolls(long currentUserId);
        List<PollListDto> GetActivePollsForPortalUser(long userId);
    }
}
