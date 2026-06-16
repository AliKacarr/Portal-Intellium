using Core.Utilities.Results.Abstract;
using Core.Utilities.Security.JWT;
using Entities.Concrete;
using Entities.DTOs;
using Entities.DTOs.AuthDtos;

namespace Business.Authentication
{
    public interface IAuthService
    {
        IDataResult<UserCustomerDto> Register(UserForRegisterDto userForRegister);
        IDataResult<User> RegisterForSecondAccount(UserForRegisterDto userForRegister, string password, long customerId);
        IDataResult<User> RegisterForCustomerAccount(UserForCustomerRegisterDto userForCustomerRegister, string password, long customerId);
        IDataResult<AuthUserDto> Login(UserForLoginDto userForLogin);
        IDataResult<User> GetByMailConfirmValue(string value);
        IResult UserExists(string email);
        IResult SendConfirmEmail(User user);
        IDataResult<Token> CreateAccessToken(User user, long customerId);
        IResult SendForgotPasswordEmail(User user, string value);
        IResult ChangePassword(User user, string newPassword);
        IDataResult<User> GetByEmail(string email);
        IDataResult<User> GetById(long id);
        IResult Update(User user);

    }
}
