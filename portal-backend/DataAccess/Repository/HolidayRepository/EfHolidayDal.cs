using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Repository.HolidayRepository
{
    public class EfHolidayDal: EfEntityRepositoryBase<Holiday, PortalContext>, IHolidayDal
    {
    }
}
