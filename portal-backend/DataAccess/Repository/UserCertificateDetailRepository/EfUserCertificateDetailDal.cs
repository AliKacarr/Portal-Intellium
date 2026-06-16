using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Repository.UserCertificateDetailRepository
{
    public class EfUserCertificateDetailDal : EfEntityRepositoryBase<UserCertificateDetail, PortalContext>, IUserCertificateDetailDal
    {
        public List<UserCertificateDetail> GetUserCertificateDetailByUserId(long userId)
        {
            using (var context = new PortalContext())
            {
                var result = (from userCertificateDetail in context.UserCertificateDetails where userCertificateDetail.UserId == userId select userCertificateDetail).ToList();

                return result;
            }
        }
    }
}
