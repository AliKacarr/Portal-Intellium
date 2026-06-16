using Core.Utilities.Results.Abstract;
using Entities.DTOs.AnnouncementDtos;
using Entities.DTOs.UserDtos;

namespace Business.Repository.AnnouncementRepository
{
    public interface IAnnouncementService
    {
        IDataResult<List<GetAnnouncementDto>> GetAll();
        IDataResult<GetAnnouncementDto> GetById(long id);
        IDataResult<List<GetAnnouncementDto>> GetActiveForCurrentUser();
        IResult Add(AddAnnouncementDto dto);
        IResult Update(UpdateAnnouncementDto dto);
        IResult Delete(long id);
        IResult IncrementViewCount(long id);
        IDataResult<List<ViewerDto>> GetViewers(long id);
    }
}
