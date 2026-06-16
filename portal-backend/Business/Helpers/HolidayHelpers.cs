using DataAccess.Repository.HolidayRepository;
using Entities.Concrete;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Business.Helpers
{
    public class HolidayHelpers
    {
        private IHolidayDal _holidayDal;

        public HolidayHelpers(IHolidayDal holidayDal)
        {
            _holidayDal = holidayDal;
        }

        public int GetHolidayBetweenDates(DateTime startDate, DateTime endDate)
        {
            int holidayCount = 0;
            var holidays = _holidayDal.GetAll();
            for (DateTime date = startDate; date <= endDate; date = date.AddDays(1))
            {
                if (IsHoliday(date, holidays))
                {
                    holidayCount++;
                }
            }

            return holidayCount;
        }

        private static bool IsHoliday(DateTime date, List<Holiday> holidays)
        {
            foreach (var holiday in holidays)
            {
                if (date >= holiday.StartTime && date <= holiday.EndTime)
                {
                    return true;
                }
            }
            return false;
        }
    }
}
