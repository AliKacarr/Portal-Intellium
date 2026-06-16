using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;

namespace DataAccess.Repository.ExpenseSettingsRepository
{
    public class EfExpenseSettingsDal : EfEntityRepositoryBase<ExpenseSettings, PortalContext>, IExpenseSettingsDal
    {
    }
}
