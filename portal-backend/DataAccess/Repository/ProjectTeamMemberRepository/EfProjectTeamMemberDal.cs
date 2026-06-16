using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;

namespace DataAccess.Repository.ProjectTeamMemberRepository
{
    public class EfProjectTeamMemberDal : EfEntityRepositoryBase<ProjectTeamMember, PortalContext>, IProjectTeamMemberDal
    {
    }
}
