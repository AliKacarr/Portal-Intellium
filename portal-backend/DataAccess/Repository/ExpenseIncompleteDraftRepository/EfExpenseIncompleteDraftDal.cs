using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;

namespace DataAccess.Repository.ExpenseIncompleteDraftRepository
{
    public class EfExpenseIncompleteDraftDal : EfEntityRepositoryBase<ExpenseIncompleteDraft, PortalContext>, IExpenseIncompleteDraftDal
    {
    }
}

