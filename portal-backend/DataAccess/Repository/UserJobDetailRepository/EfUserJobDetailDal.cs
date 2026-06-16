using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Repository.UserJobDetailRepository
{
    public class EfUserJobDetailDal : EfEntityRepositoryBase<UserJobDetail, PortalContext>, IUserJobDetailDal
    {
        
    }
}
