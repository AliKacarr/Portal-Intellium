using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;
using Entities.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Repository.DebitRepository
{
    public class EfDebitDal : EfEntityRepositoryBase<Debit, PortalContext>, IDebitDal
    {

    }
}
