using Core.DataAccess;
using Entities.Concrete;

namespace DataAccess.Repository.ExpenseRepository
{
    public interface IExpenseDal : IEntityRepository<Expense>
    {
        void AddRange(List<Expense> entities);
        void AddWithItems(Expense expense, List<ExpenseItem> items);
    }
}
