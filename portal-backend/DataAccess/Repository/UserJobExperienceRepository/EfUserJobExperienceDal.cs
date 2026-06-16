using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;

namespace DataAccess.Repository.UserJobExperienceRepository
{
    public class EfUserJobExperienceDal : EfEntityRepositoryBase<UserJobExperience, PortalContext>, IUserJobExperienceDal
    {
    }
}
