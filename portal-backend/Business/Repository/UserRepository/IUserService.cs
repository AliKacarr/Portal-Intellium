using Core.Utilities.Results.Abstract;
using Entities.Concrete;
using Entities.DTOs.UserDtos;
using Microsoft.AspNetCore.Http;
using IResult = Core.Utilities.Results.Abstract.IResult;

namespace Business.Repository.UserRepository
{
    public interface IUserService
    {

        //IDataResult<List<OperationClaim>> GetOperationClaims(User user);
        IDataResult<List<OperationClaim>> GetOperationClaims(User user, long customerId);
        IResult Add(User user);
        IResult Update(User user);
        IResult UpdateAsDto(EditUserDto editUser);
        IDataResult<List<UserDto>> GetAll();
        IDataResult<User> GetById(long id);
        IDataResult<UserDto> GetUserAsDtoById(long id);
        IDataResult<List<UserDto>> GetByName(string name);
        User GetByMail(string email);
        User GetByConfirmValue(string value);
        IResult DoesUserExist(long userId);
        Task<IResult> ChangeImage(IFormFile image, long userId);
        IResult RemoveImage(long userId);
        Task<IResult> HardDeleteUser(long userId);
    }
}
