using System;
using Business.Authentication;
using Business.Repository.AgreementRepository;
using Business.Repository.ForgotPasswordRepository;
using Entities.DTOs;
using Entities.DTOs.AuthDtos;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IForgotPasswordService _forgotPasswordService;
        private readonly IAgreementService _agreementService;

        public AuthController(IAuthService authService, IForgotPasswordService forgotPasswordService, IAgreementService agreementService)
        {
            _authService = authService;
            _forgotPasswordService = forgotPasswordService;
            _agreementService = agreementService;
        }

        [HttpPost("register")]
        public IActionResult Register(UserForRegisterDto userForRegisterDto)
        {
            var registerResult = _authService.Register(userForRegisterDto);
            if (!registerResult.Success) return BadRequest(registerResult.Message);

            var result = _authService.CreateAccessToken(registerResult.Data, registerResult.Data.CustomerId);
            if (result.Success)
            {
                return Ok(result.Data);
            }
            return BadRequest(registerResult.Message);
        }

        [HttpPost("login")]
        public IActionResult Login(UserForLoginDto userForLogin)
        {
            try
            {
                var result = _authService.Login(userForLogin);
                if (result.Success)
                {
                    return Ok(result.Data);
                }
                return BadRequest(new { message = result.Message ?? "E-posta veya şifre hatalı!" });
            }
            catch (Exception ex)
            {
                // Dev ortamında teşhis için: 500'ün gerçek nedenini response body'de göster
                return StatusCode(500, new { message = "Login sırasında sunucu hatası oluştu.", title = ex.Message, detail = ex.ToString() });
            }
        }

        //[HttpPost("registerSecondAccount")]
        //public IActionResult RegisterSecondAccount(UserForRegisterDto userForRegister)
        //{
        //    var userExist = _authService.UserExists(userForRegister.Email);
        //    if (!userExist.Success)
        //    {
        //        return BadRequest(userExist.Message);
        //    }
        //    var registerResult = _authService.RegisterForSecondAccount(userForRegister, userForRegister.Password, userForRegister.CustomerId);
        //    var result = _authService.CreateAccessToken(registerResult.Data, userForRegister.CustomerId);
        //    if (result.Success)
        //    {
        //        return Ok(result.Data);
        //    }
        //    return BadRequest(registerResult.Message);
        //}

        //[HttpPost("RegisterForCustomerAccount")]
        //public IActionResult RegisterForCustomerAccount(UserForCustomerRegisterDto userForCustomerRegister)
        //{
        //    var userExist = _authService.UserExists(userForCustomerRegister.Email);
        //    if (!userExist.Success)
        //    {
        //        return BadRequest(userExist.Message);
        //    }
        //    var registerResult = _authService.RegisterForCustomerAccount(userForCustomerRegister, userForCustomerRegister.Password, userForCustomerRegister.CustomerId);
        //    var result = _authService.CreateAccessToken(registerResult.Data, userForCustomerRegister.CustomerId);
        //    if (result.Success)
        //    {
        //        return Ok(result.Data);
        //    }
        //    return BadRequest(registerResult.Message);
        //}


        [HttpGet("confirmuser")]
        public IActionResult ConfirmUser(string value)
        {
            var userResult = _authService.GetByMailConfirmValue(value);
            if (!userResult.Success || userResult.Data == null)
            {
                return BadRequest("Gecersiz dogrulama baglantisi!");
            }

            var user = userResult.Data;
            user.MailConfirm = true;
            user.MailConfirmDate = DateTime.Now;
            var result = _authService.Update(user);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result.Message);
        }

        [HttpGet("sendConfirmEmail")]
        public IActionResult SendConfirmEmail(long id)
        {
            var userResult = _authService.GetById(id);
            if (!userResult.Success || userResult.Data == null)
            {
                return BadRequest("Kullanici bulunamadi!");
            }

            var result = _authService.SendConfirmEmail(userResult.Data);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result.Message);
        }

        [HttpGet("forgotPassword")]
        public IActionResult ForgotPassword(string email)
        {
            var userResult = _authService.GetByEmail(email);
            if (!userResult.Success || userResult.Data == null)
            {
                return BadRequest("Kullanici bulunamadi!");
            }

            var user = userResult.Data;
            if (!user.IsActive)
            {
                return BadRequest(
                    "Kullanıcı pasif durumda olduğu için şifre sıfırlama talebi gönderilemez. Aktif etmek için yöneticinize başvurunuz.");
            }

            var lists = _forgotPasswordService.GetListByUserId(user.Id).Data;
            lists.ForEach(list =>
            {
                list.IsActive = false;
                _forgotPasswordService.Update(list);
            });

            var forgotPassword = _forgotPasswordService.CreateForgotPassword(user).Data;
            var result = _authService.SendForgotPasswordEmail(user, forgotPassword.Value);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result.Message);
        }

        [HttpGet("forgotPasswordLinkCheck")]
        public IActionResult ForgotPasswordLinkCheck(string value)
        {
            var result = _forgotPasswordService.GetForgotPassword(value);
            if (result == null)
            {
                return BadRequest("Gecersiz baglanti!");
            }
            if (result.IsActive == true)
            {
                DateTime sendDate = DateTime.Now.AddHours(-1);
                DateTime nowDate = DateTime.Now;
                if (result.SendDate >= sendDate && result.SendDate <= nowDate)
                {
                    return Ok(true);
                }
                else
                {
                    return BadRequest("Gecersiz baglanti!");
                }
            }
            else
            {
                return BadRequest("Gecersiz baglanti!");
            }
        }

        [HttpPost("changePasswordToForgotPassword")]
        public IActionResult ChangePasswordToForgotPassword(ForgotPasswordDto passwordDto)
        {
            var forgotPasswordResult = _forgotPasswordService.GetForgotPassword(passwordDto.Value);
            if (forgotPasswordResult == null || !forgotPasswordResult.IsActive)
            {
                return BadRequest("Gecersiz baglanti!");
            }

            var userResult = _authService.GetById(forgotPasswordResult.UserId).Data;
            if (passwordDto.AgreementIds == null || passwordDto.AgreementIds.Count == 0)
            {
                return BadRequest("KVKK ve açık rıza metinleri onaylanmadan şifre oluşturulamaz.");
            }

            var agreementAcceptResult = _agreementService.AcceptActiveAgreements(
                forgotPasswordResult.UserId,
                passwordDto.AgreementIds,
                requireAllActive: true);
            if (!agreementAcceptResult.Success)
            {
                return BadRequest(agreementAcceptResult.Message);
            }

            var legalConsentAcceptedAt = passwordDto.LegalConsentAcceptedAt ?? DateTime.UtcNow;
            userResult.LegalConsentAcceptedAt = DateTime.SpecifyKind(
                legalConsentAcceptedAt.ToUniversalTime(),
                DateTimeKind.Unspecified);

            forgotPasswordResult.IsActive = false;//link ikinci defa kullanılamaz
            _forgotPasswordService.Update(forgotPasswordResult);

            var result = _authService.ChangePassword(userResult, passwordDto.Password);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result.Message);
        }
    }
}
