using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;

namespace DataAccess.Repository.ExpenseRepository
{
    public class EfExpenseItemDal : EfEntityRepositoryBase<ExpenseItem, PortalContext>, IExpenseItemDal
    {
    }
}

