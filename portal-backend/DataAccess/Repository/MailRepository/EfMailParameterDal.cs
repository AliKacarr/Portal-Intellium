using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Repository.MailRepository
{
    public class EfMailParameterDal : EfEntityRepositoryBase<MailParameters, PortalContext>, IMailParameterDal
    {
    }
}
