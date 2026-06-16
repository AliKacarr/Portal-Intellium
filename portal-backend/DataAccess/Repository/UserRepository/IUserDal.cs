using Core.DataAccess;
using Entities.Concrete;
using Entities.DTOs.UserDtos;

namespace DataAccess.Repository.UserRepository
{
    public interface IUserDal : IEntityRepository<User>
    {
        List<OperationClaim> GetClaims(User user, long customerId);
        List<UserDto> GetByName(string name);
        List<UserDto> GetAllForUserList();
        UserDto GetUserAsDtoById(long id);
    }
}
