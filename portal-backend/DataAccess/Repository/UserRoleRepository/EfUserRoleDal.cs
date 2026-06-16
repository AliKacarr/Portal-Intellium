using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using DataAccess.Repository.UserRepository;
using Entities.Concrete;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Repository.UserRoleRepository
{
    public class EfUserRoleDal : EfEntityRepositoryBase<UserRole, PortalContext>, IUserRoleDal
    {
    }
}
