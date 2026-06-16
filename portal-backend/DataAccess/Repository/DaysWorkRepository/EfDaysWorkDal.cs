using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using DataAccess.Repository.CustomRepository;
using Entities.Concrete;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Repository.DaysWorkRepository
{
    public class EfDaysWorkDal : EfEntityRepositoryBase<DaysWork, PortalContext>, IDaysWorkDal
    {
        public List<DaysWork> GetByDay(DateTime Day)
        {
            throw new NotImplementedException();
        }

        public List<DaysWork> GetByMonth(int month, int year)
        {
            using (var context = new PortalContext())
            {
                var result = (from daysWork in context.DaysWorks where daysWork.Day.Month == month && daysWork.Day.Year == year select daysWork).ToList();

                return result;
            }
        }

        public List<DaysWork> GetDaysWorkByUserId(int userId)
        {
            using (var context = new PortalContext())
            {
                var result = (from daysWork in context.DaysWorks where daysWork.UserId == userId select daysWork).ToList();

                return result;
            }
        }
    }
}
