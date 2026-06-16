using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Repository.CustomRepository
{
    public class EfCustomDal: EfEntityRepositoryBase<Custom, PortalContext>, ICustomDal
    {
    }
}
