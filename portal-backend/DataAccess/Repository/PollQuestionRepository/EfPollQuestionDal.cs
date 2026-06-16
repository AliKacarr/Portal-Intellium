using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;

namespace DataAccess.Repository.PollQuestionRepository
{
    public class EfPollQuestionDal : EfEntityRepositoryBase<PollQuestion, PortalContext>, IPollQuestionDal
    {
    }
}
