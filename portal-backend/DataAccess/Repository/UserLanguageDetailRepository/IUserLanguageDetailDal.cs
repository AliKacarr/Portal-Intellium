using Core.DataAccess;
using Entities.Concrete;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Repository.UserLanguageDetailRepository
{
    public interface  IUserLanguageDetailDal:IEntityRepository<UserLanguageDetail>
    {
        List<UserLanguageDetail> GetById(long userId);
    }
}
