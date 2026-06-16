using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Repository.UserEducationDetailRepository
{
    public class EfUserEducationDetailDal : EfEntityRepositoryBase<UserEducationDetail, PortalContext>, IUserEducationDetailDal
    {
        public List<UserEducationDetail> GetUserEducationDetailByUserId(long userId)
        {
            using (var context = new PortalContext())
            {
                var result = (from userEducationDetail in context.UserEducationDetails where userEducationDetail.UserId == userId select userEducationDetail).ToList();

                return result;
            }
        }
    }
}
