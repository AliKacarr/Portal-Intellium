using Core.Utilities.Results.Abstract;
using Entities.Concrete;

namespace Business.Repository.UserJobExperienceRepository
{
    public interface IUserJobExperienceService
    {
        IResult Add(UserJobExperience userJobExperience);
        IResult Delete(long id);
        IResult Update(UserJobExperience userJobExperience);
        IDataResult<List<UserJobExperience>> GetAllByUserId(long userId);
    }
}
