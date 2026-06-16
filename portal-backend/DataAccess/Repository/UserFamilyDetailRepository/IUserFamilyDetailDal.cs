using Core.DataAccess;
using Entities.Concrete;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Repository.UserFamilyDetailRepository
{
    public interface IUserFamilyDetailDal : IEntityRepository<UserFamilyDetail>
    {
       List< UserFamilyDetail> GetUserFamilyDetailByUserId(long userId);
    }
}
