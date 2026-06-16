using Core.Utilities.Results.Abstract;
using Entities.Concrete;

namespace Business.Repository.UserRoleRepository
{
    public interface IUserRoleService
    {
        IResult Add(UserRole userRole);
        IResult Update(UserRole userRole);
        IResult Delete(long id);
        IDataResult<List<UserRole>> GetAll();
        IDataResult<UserRole> GetByRoleName(string roleName);
        IDataResult<UserRole> GetByRoleId(long id);
    }
}
