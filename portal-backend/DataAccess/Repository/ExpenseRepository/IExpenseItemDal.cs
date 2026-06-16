using Core.DataAccess;
using Entities.Concrete;

namespace DataAccess.Repository.ExpenseRepository
{
    public interface IExpenseItemDal : IEntityRepository<ExpenseItem>
    {
    }
}

