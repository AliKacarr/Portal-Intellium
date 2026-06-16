using Core.DataAccess;
using Entities.Concrete;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Repository.DaysWorkRepository
{
    public interface IDaysWorkDal :IEntityRepository<DaysWork>
    {
        List<DaysWork> GetByDay(DateTime Day);
        List<DaysWork> GetDaysWorkByUserId(int userId);
        List<DaysWork> GetByMonth(int month , int year);
        
    }
}
