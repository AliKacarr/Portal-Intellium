using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Repository.MailRepository
{
    public class EfMailTemplatesDal : EfEntityRepositoryBase<MailTemplates, PortalContext>, IMailTemplatesDal
    {

    }
}
