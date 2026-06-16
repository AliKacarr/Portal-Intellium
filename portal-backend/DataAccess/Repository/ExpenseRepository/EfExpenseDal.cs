using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Repository.ExpenseRepository
{
    public class EfExpenseDal : EfEntityRepositoryBase<Expense, PortalContext>, IExpenseDal
    {
        public void AddRange(List<Expense> entities)
        {
            if (entities == null || entities.Count == 0) return;
            using (var context = new PortalContext())
            {
                context.Set<Expense>().AddRange(entities);
                context.SaveChanges();
            }
        }

        public void AddWithItems(Expense expense, List<ExpenseItem> items)
        {
            using (var context = new PortalContext())
            using (var tx = context.Database.BeginTransaction())
            {
                try
                {
                    context.Set<Expense>().Add(expense);
                    context.SaveChanges();

                    if (items != null && items.Count > 0)
                    {
                        foreach (var item in items)
                        {
                            item.ExpenseId = expense.Id;
                        }
                        context.Set<ExpenseItem>().AddRange(items);
                        context.SaveChanges();
                    }

                    tx.Commit();
                }
                catch
                {
                    tx.Rollback();
                    throw;
                }
            }
        }
    }
}
