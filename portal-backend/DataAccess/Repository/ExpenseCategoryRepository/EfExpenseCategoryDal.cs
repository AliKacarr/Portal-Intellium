using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;

namespace DataAccess.Repository.ExpenseCategoryRepository
{
    public class EfExpenseCategoryDal : EfEntityRepositoryBase<ExpenseCategory, PortalContext>, IExpenseCategoryDal
    {
    }
}
