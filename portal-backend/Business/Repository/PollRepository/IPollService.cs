using Core.Utilities.Results.Abstract;
using Entities.DTOs.PollDtos;

namespace Business.Repository.PollRepository
{
    public interface IPollService
    {
        IDataResult<List<PollListDto>> GetAll();
        IDataResult<List<PollListDto>> GetActive();
        IDataResult<GetPollDto> GetById(long id);
        IResult Add(AddPollDto dto);
        IResult Update(UpdatePollDto dto);
        IResult Vote(VotePollDto dto);
        IResult Delete(long id);
    }
}
