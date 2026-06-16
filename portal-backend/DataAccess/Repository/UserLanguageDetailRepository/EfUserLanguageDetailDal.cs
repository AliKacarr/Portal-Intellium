using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Repository.UserLanguageDetailRepository
{
    public class EfUserLanguageDetailDal : EfEntityRepositoryBase<UserLanguageDetail, PortalContext>, IUserLanguageDetailDal
    {

        public List<UserLanguageDetail> GetById(long userId)
        {
            using (var context = new PortalContext())
            {
                var result = (from userLanguageDetail in context.UserLanguageDetails where userLanguageDetail.UserId == userId select userLanguageDetail).ToList();
                return result;
            }

        }
    }
}
