using Core.DataAccess;
using Entities.Concrete;
using Entities.DTOs.AnnouncementDtos;
using Entities.DTOs.UserDtos;

namespace DataAccess.Repository.AnnouncementRepository
{
    public interface IAnnouncementDal : IEntityRepository<Announcement>
    {
        List<GetAnnouncementDto> GetAllAsDto();
        GetAnnouncementDto GetByIdAsDto(long id);
        List<GetAnnouncementDto> GetActiveAsDtoForPortalUser(long userId);
        void IncrementViewCount(long announcementId);
        void RecordView(long announcementId, long userId);
        List<ViewerDto> GetViewers(long announcementId);
    }
}
