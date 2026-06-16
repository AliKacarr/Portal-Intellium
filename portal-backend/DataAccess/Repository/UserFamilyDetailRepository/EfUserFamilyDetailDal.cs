using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Repository.UserFamilyDetailRepository
{
    public class EfUserFamilyDetailDal : EfEntityRepositoryBase<UserFamilyDetail, PortalContext>, IUserFamilyDetailDal
    {
        public List<UserFamilyDetail> GetUserFamilyDetailByUserId(long userId)
        {
            using (var context = new PortalContext())
            {
                var result = (from userFamilyDetail in context.UserFamilyDetails where userFamilyDetail.UserId == userId select userFamilyDetail).ToList();

                return result;
            }
        }
    }
}
