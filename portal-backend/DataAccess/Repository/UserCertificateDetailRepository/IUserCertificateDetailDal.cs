using Core.DataAccess;
using Entities.Concrete;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Repository.UserCertificateDetailRepository
{
    public interface IUserCertificateDetailDal: IEntityRepository<UserCertificateDetail>
    {
        List<UserCertificateDetail> GetUserCertificateDetailByUserId(long userId);
    }
}
