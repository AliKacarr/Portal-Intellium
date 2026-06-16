using AutoMapper;
using System;
using System.Collections.Generic;
using System.Linq;
using Business.BusinessAspects;
using Business.Repository.CustomerRepository;
using Business.Repository.CustomerRepository.Constants;
using Business.Repository.MailRepository;
using Business.Repository.MailRepository.Constans;
using Business.Repository.MailTemplatesRepository;
using Business.Repository.ForgotPasswordRepository;
using Business.Repository.RolesForUsersRepository;
using Business.Repository.UserCustomerRepository;
using Business.Repository.UserJobDetailsRepository;
using Business.Repository.UserRepository;
using Business.Repository.UserRepository.Constants;
using Business.Repository.UserRoleRepository;
using Business.Repository.UserRoleRepository.Constants;
using Business.Repository.AgreementRepository;
using Business.Configuration;
using Business.Helpers;
using Core.Aspects.Autofac.Transaction;
using Core.Identity;
using Core.Utilities.Hashing;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using Core.Utilities.Security.JWT;
using Entities.Concrete;
using Entities.DTOs;
using Entities.DTOs.AuthDtos;
using Entities.DTOs.CustomerDtos;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;

namespace Business.Authentication
{
    public class AuthManager : IAuthService
    {
        private readonly IUserService _userService;
        private readonly ITokenHandler _tokenHandler;
        private readonly ICustomerService _customerService;
        private readonly IUserCustomerService _userCustomerService;
        private readonly IRolesForUsersService _rolesForUsersService;
        private readonly IUserRoleService _userRoleService;
        private readonly IUserJobDetailService _userJobDetailService;
        private readonly IMailService _mailService;
        private readonly IMailParameterService _mailParameter;
        private readonly IMailTemplatesService _mailTemplatesService;
        private readonly IForgotPasswordService _forgotPasswordService;
        private readonly IConfiguration _configuration;
        private readonly IMapper _mapper;
        private readonly IPortalAppUrlProvider _portalAppUrlProvider;
        private readonly IOptions<SmtpSettings> _smtpSettings;
        private readonly IAgreementService _agreementService;

        public AuthManager(IUserService userService, IUserCustomerService userCustomerService, ITokenHandler tokenHandler, IMailService mailService, IMailParameterService mailParameter, IMailTemplatesService mailTemplatesService, IForgotPasswordService forgotPasswordService, ICustomerService customerService, IRolesForUsersService rolesForUsersService, IUserRoleService userRoleService, IConfiguration configuration, IMapper mapper, IUserJobDetailService userJobDetailService, IPortalAppUrlProvider portalAppUrlProvider, IOptions<SmtpSettings> smtpSettings, IAgreementService agreementService)
        {
            _userService = userService;
            _userCustomerService = userCustomerService;
            _tokenHandler = tokenHandler;
            _mailService = mailService;
            _mailParameter = mailParameter;
            _mailTemplatesService = mailTemplatesService;
            _forgotPasswordService = forgotPasswordService;
            _customerService = customerService;
            _rolesForUsersService = rolesForUsersService;
            _userRoleService = userRoleService;
            _configuration = configuration;
            _mapper = mapper;
            _userJobDetailService = userJobDetailService;
            _portalAppUrlProvider = portalAppUrlProvider;
            _smtpSettings = smtpSettings;
            _agreementService = agreementService;
        }

        public IDataResult<Token> CreateAccessToken(User user, long customerId)
        {
            try
            {
                var claims = _userService.GetOperationClaims(user, customerId).Data ?? new List<OperationClaim>();

                // SecuredOperation(RoleNames.*) rol kontrolünü ClaimTypes.Role üzerinden yapar.
                // Bu yüzden kullanıcının gerçek rol adını da JWT'ye ekle (operation claim boş olsa bile).
                try
                {
                    var rfu = _rolesForUsersService.GetRolesForUsersByUserId(user.Id);
                    if (rfu.Success && rfu.Data != null)
                    {
                        var roleRes = _userRoleService.GetByRoleId(rfu.Data.RoleId);
                        var roleName = roleRes.Success ? roleRes.Data?.RoleName : null;
                        if (!string.IsNullOrWhiteSpace(roleName)
                            && !claims.Any(c => string.Equals(c.Name, roleName, StringComparison.OrdinalIgnoreCase)))
                        {
                            claims.Add(new OperationClaim { Name = roleName.Trim() });
                        }
                    }
                }
                catch
                {
                    // rol okunamazsa token yine üretilebilsin
                }
                var customer = _customerService.GetById(customerId).Data;
                var customerName = customer?.CustomerName ?? "";
                var accessToken = _tokenHandler.CreateToken(user, claims, customerId, customerName);
                return new SuccessDataResult<Token>(accessToken);
            }
            catch (Exception ex)
            {
                return new ErrorDataResult<Token>($"Token oluşturulamadı: {ex.Message}");
            }
        }

        public IDataResult<User> GetByMailConfirmValue(string value)
        {
            return new SuccessDataResult<User>(_userService.GetByConfirmValue(value));
        }

        void SendConfirmEmail(User user)
        {
            //daha sonra dinamik hale getirilecektir.
            string subject = "Kullanıcı Kayıt Onay Maili";
            string body = "Kullanıcı sisteme kayıt oldu. Kaydınızı tamamlamak için aşağıdaki linke tıklayınız.";
            // Confirm linki AppSettings:AppUrl üzerinden
            string link = _portalAppUrlProvider.GetEmailVerifyLinkPrefix() + user.ConfirmValue;

            string linkDescription = "Kayıt Onaylamak İçin Tıklayın";

            string templateBody = BuildMailBody(
                "EmailVerification.html",
                user.Name ?? "Kullanici",
                link,
                subject,
                body,
                linkDescription
            );

            var parameter = _mailParameter.GetParameters(1);
            SendMailDto sendMailDto = new SendMailDto()
            {
                MailParameters = parameter.Data,
                ToEmail = user.Email,
                Subject = subject,
                Body = templateBody
            };
            _mailService.SendMail(sendMailDto);//mail gönder

            user.MailConfirmDate = DateTime.Now;//son gönderilen mail tarihini tutar
            _userService.Update(user);
        }


        public IResult UserExists(string email)
        {
            var result = _userService.GetByMail(email);

            if (result != null)
            {
                return new ErrorResult(UserMessages.UserAlreadyExist);
            }
            return new SuccessResult();
        }

        IResult IAuthService.SendConfirmEmail(User user)
        {
            if (user.MailConfirm == true)
            {
                return new ErrorResult(MailMessages.MailAlreadyConfirm);
            }

            DateTime confirmMailDate = (DateTime)user.MailConfirmDate;
            DateTime now = DateTime.Now;
            if (confirmMailDate.ToShortDateString() == now.ToShortDateString())
            {
                if (confirmMailDate.Hour == now.Hour && confirmMailDate.AddMinutes(5).Minute <= now.Minute)
                {
                    SendConfirmEmail(user);
                    return new SuccessResult(MailMessages.MailConfirmSendSuccesfull);
                }
                else
                {
                    return new ErrorResult(MailMessages.MailConfirmTimeHasNotExpired);
                }
            }
            SendConfirmEmail(user);
            return new SuccessResult(MailMessages.MailConfirmSendSuccesfull);



        }

		[LoggerAspect]
		public IDataResult<AuthUserDto> Login(UserForLoginDto userForLogin)
        {
            var email = userForLogin?.Email?.Trim();
            var password = userForLogin?.Password;
            if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
            {
                return new ErrorDataResult<AuthUserDto>(UserMessages.EmailOrPasswordError);
            }
            var userToCheck = _userService.GetByMail(email);
            if (userToCheck == null)
            {
                return new ErrorDataResult<AuthUserDto>(UserMessages.EmailOrPasswordError);
            }

            if (!HashingHelper.VerifyPasswordHash(password, userToCheck.PasswordHash, userToCheck.PasswordSalt))
            {
                return new ErrorDataResult<AuthUserDto>(UserMessages.EmailOrPasswordError);
            }

            if (!userToCheck.IsActive)
            {
                return new ErrorDataResult<AuthUserDto>("Kullanıcı pasif durumda olduğu için giriş yapamaz. Aktif etmek için yöneticinize başvurunuz.");
            }

            // Fresh kurulumlarda seed/ilişkiler eksik olabiliyor. Null'ları yakalayıp 500 yerine düzelt veya anlamlı hata dön.
            var userCustomer = _userCustomerService.GetByUserId(userToCheck.Id).Data;
            if (userCustomer == null)
            {
                // Varsayılan müşteri: 1 (seed). Yoksa ilk müşteri.
                var defaultCustomer = _customerService.GetById(1).Data ?? _customerService.GetAllAsRaw().Data?.FirstOrDefault();
                if (defaultCustomer != null)
                {
                    _userCustomerService.Add(new UserCustomer { UserId = userToCheck.Id, CustomerId = defaultCustomer.CustomerId });
                    userCustomer = _userCustomerService.GetByUserId(userToCheck.Id).Data;
                }
            }
            if (userCustomer == null)
                return new ErrorDataResult<AuthUserDto>("Kullanıcı müşteri ilişkisi bulunamadı. Veritabanı seed/migration eksik olabilir.");

            var customer = _customerService.GetById(userCustomer.CustomerId).Data;
            if (customer == null)
                return new ErrorDataResult<AuthUserDto>("Müşteri bulunamadı. Veritabanı seed/migration eksik olabilir.");

            var token = CreateAccessToken(userToCheck, userCustomer.CustomerId);

            if (!token.Success)
            {
                return new ErrorDataResult<AuthUserDto>("Giriş yapmaya çalışılırken hata meydana geldi.");
            }

            var rolesForUser = _rolesForUsersService.GetRolesForUsersByUserId(userToCheck.Id);
            if (!rolesForUser.Success || rolesForUser.Data == null)
            {
                // Varsayılan rol: User (Id=3) (seed)
                _rolesForUsersService.Add(new RolesForUsers { UserId = userToCheck.Id, RoleId = 3 });
                rolesForUser = _rolesForUsersService.GetRolesForUsersByUserId(userToCheck.Id);
            }
            if (!rolesForUser.Success || rolesForUser.Data == null)
                return new ErrorDataResult<AuthUserDto>("Kullanıcı rol ilişkisi bulunamadı. Veritabanı seed/migration eksik olabilir.");

            var userRole = _userRoleService.GetByRoleId(rolesForUser.Data.RoleId);
            if (!userRole.Success || userRole.Data == null)
                return new ErrorDataResult<AuthUserDto>("Kullanıcı rolü bulunamadı. Veritabanı seed/migration eksik olabilir.");
            var userJob = _userJobDetailService.GetByUserIdForBusiness(userToCheck.Id).Data;
            var requiredAgreementIds = _agreementService.GetRequiredAgreementIds(userToCheck.Id).Data;

            AuthUserDto authUser = new()
            {
                Id = userToCheck.Id,
                Customer = _mapper.Map<BasicCustomerDto>(customer),
                Name = userToCheck.Name,
                Email = userToCheck.Email,
                ImageUrl = userToCheck.ImageUrl,
                IsActive = userToCheck.IsActive,
                AccessToken = token.Data.AccessToken,
                RefreshToken = token.Data.RefreshToken,
                Expiration = token.Data.Expiration,
                Role = userRole.Data,
                JobTitle = userJob?.JobTitle,
                Department = userJob?.Department,
                ServiceArea = userJob?.ServiceArea,
                RequiresAgreementUpdate = requiredAgreementIds.Any(),
                RequiredAgreementIds = requiredAgreementIds,
            };

            return new SuccessDataResult<AuthUserDto>(authUser, UserMessages.SuccessfulLogin);
        }


		[LoggerAspect]
        [SecuredOperation(RoleNames.Admin)]
		[TransactionScopeAspect]//burada hem kullanıcı hemde şirket kaydı yapıldığı için buraya konuldu
        public IDataResult<UserCustomerDto> Register(UserForRegisterDto userForRegister)
        {
            if (!UserExists(userForRegister.Email).Success) return new ErrorDataResult<UserCustomerDto>(UserMessages.UserAlreadyExist);
            if (!_customerService.GetById(userForRegister.CustomerId).Success) return new ErrorDataResult<UserCustomerDto>(CustomerMessages.CustomerNotFound);
            if (!_userRoleService.GetByRoleId(userForRegister.UserRoleId).Success) return new ErrorDataResult<UserCustomerDto>(UserRoleMessages.UserRoleNotFound);

            var passwordFromRequest = userForRegister.Password?.Trim();
            var shouldSendPasswordSetupEmail = string.IsNullOrWhiteSpace(passwordFromRequest);
            var passwordToHash = shouldSendPasswordSetupEmail
                ? $"Tmp!{Guid.NewGuid():N}"
                : passwordFromRequest;

            byte[] passwordHash, passwordSalt;
            HashingHelper.CreatePasswordHash(passwordToHash, out passwordHash, out passwordSalt);
            User user = new()
            {
                Language = userForRegister.Language,
                Email = userForRegister.Email.ToLower(),
                AddetAt = DateTime.UtcNow,           // Hesap oluşturma tarihi
                IsConfirm = true,
                MailConfirm = false,
                IsActive = true,
                MailConfirmDate = DateTime.UtcNow,
                ConfirmValue = Guid.NewGuid().ToString(),
                PasswordHash = passwordHash,
                PasswordSalt = passwordSalt,
                Name = userForRegister.Name,

            };

            _userService.Add(user);

            UserCustomer userCustomer = new()
            {
                UserId = user.Id,
                CustomerId = userForRegister.CustomerId
            };
            _userCustomerService.Add(userCustomer);

            RolesForUsers rolesForUsers = new()
            {
                RoleId = userForRegister.UserRoleId,
                UserId = user.Id
            };
            _rolesForUsersService.Add(rolesForUsers);

            if (shouldSendPasswordSetupEmail)
            {
                var forgotPassword = _forgotPasswordService.CreateForgotPassword(user).Data;
                var sendMailResult = SendForgotPasswordEmail(user, forgotPassword.Value, true);
                if (!sendMailResult.Success)
                {
                    return new ErrorDataResult<UserCustomerDto>(sendMailResult.Message);
                }
            }



            UserCustomerDto userCustomerDto = new()
            {
                Id = user.Id,
                Name = user.Name,
                Language = userForRegister.Language,
                Email = user.Email,
                AddetAt = user.AddetAt,
                CustomerId = userForRegister.CustomerId,
                IsActive = true,
                MailConfirm = user.MailConfirm,
                MailConfirmDate = user.MailConfirmDate,
                ConfirmValue = user.ConfirmValue,
                PasswordHash = user.PasswordHash,
                PasswordSalt = user.PasswordSalt
            };
            //SendConfirmEmail(user);

            return new SuccessDataResult<UserCustomerDto>(userCustomerDto, UserMessages.UserRegistered);
        }
        public IDataResult<User> RegisterForSecondAccount(UserForRegisterDto userForRegister, string password, long customerId)
        {
            byte[] passwordHash, passwordSalt;
            HashingHelper.CreatePasswordHash(userForRegister.Password, out passwordHash, out passwordSalt);
            var user = new User()
            {
                Language = userForRegister.Language,
                Email = userForRegister.Email,
                AddetAt = DateTime.UtcNow,           // Hesap oluşturma tarihi
                IsConfirm = true,
                IsActive = true,
                MailConfirm = false,
                MailConfirmDate = DateTime.Now,
                ConfirmValue = Guid.NewGuid().ToString(),
                PasswordHash = passwordHash,
                PasswordSalt = passwordSalt,
                Name = userForRegister.Name,
            };
            _userService.Add(user);

            UserCustomer userCustomer = new()
            {
                UserId = user.Id,
                CustomerId = customerId
            };
            _userCustomerService.Add(userCustomer);
            SendConfirmEmail(user);


            return new SuccessDataResult<User>(user, UserMessages.UserRegistered);
        }

        [TransactionScopeAspect]//burada hem kullanıcı hemde şirket kaydı yapıldığı için buraya konuldu
        public IDataResult<User> RegisterForCustomerAccount(UserForCustomerRegisterDto userForCustomerRegister, string password, long customerId)
        {
            byte[] passwordHash, passwordSalt;
            HashingHelper.CreatePasswordHash(userForCustomerRegister.Password, out passwordHash, out passwordSalt);
            var user = new User()
            {

                Email = userForCustomerRegister.Email,
                AddetAt = DateTime.UtcNow,           // Hesap oluşturma tarihi
                IsConfirm = true,
                IsActive = true,
                MailConfirm = false,
                MailConfirmDate = DateTime.Now,
                ConfirmValue = Guid.NewGuid().ToString(),
                PasswordHash = passwordHash,
                PasswordSalt = passwordSalt,
                Name = userForCustomerRegister.Name
            };
            _userService.Add(user);
            UserCustomer userCustomer = new()
            {
                UserId = user.Id,
                CustomerId = customerId
            };
            _userCustomerService.Add(userCustomer);
            SendConfirmEmail(user);
            return new SuccessDataResult<User>(user, UserMessages.UserRegistered);
        }

        public IResult SendForgotPasswordEmail(User user, string value)
        {
            return SendForgotPasswordEmail(user, value, false);
        }

        private IResult SendForgotPasswordEmail(User user, string value, bool isPasswordSetup)
        {
            string subject = isPasswordSetup ? "Şifre Oluştur" : "Şifremi Unuttum";
            string body = isPasswordSetup
                ? "Portal hesabınız için bir kullanıcı oluşturuldu. Hesabınızı aktif kullanabilmek için aşağıdaki butona tıklayarak şifrenizi oluşturabilirsiniz."
                : "Şifrenizi unuttuğunuzu belirttiniz. Aşağıdaki linke tıklayarak şifrenizi yeniden belirleyebilirsiniz.";
            // Link AppSettings:AppUrl üzerinden
            string link = _portalAppUrlProvider.GetPasswordResetLinkPrefix() + value;
            string liknDescription = isPasswordSetup
                ? "Şifre Oluştur"
                : "Şifrenizi Tekrar Belirlemek İçin Tıklayınız.";

            string templateBody = BuildMailBody(
                "ForgotPassword.html",
                user.Name ?? "Kullanici",
                link,
                subject,
                body,
                liknDescription
            );

            var mailParameter = _mailParameter.GetParameters(1);
            var selectedMailParameters = mailParameter?.Data;
            if (selectedMailParameters == null
                || string.IsNullOrWhiteSpace(selectedMailParameters.SMTP)
                || string.IsNullOrWhiteSpace(selectedMailParameters.User)
                || string.IsNullOrWhiteSpace(selectedMailParameters.Password))
            {
                var smtp = _smtpSettings.Value;
                var smtpHost = (smtp.Host ?? "").Trim();
                var smtpUser = (smtp.User ?? "").Trim();
                var smtpPassword = (smtp.Password ?? "").Replace(" ", "").Trim();
                var smtpPort = smtp.Port > 0 ? smtp.Port : 587;
                var smtpSsl = smtp.Ssl;
                var smtpFromEmail = (smtp.FromEmail ?? "").Trim();
                if (string.IsNullOrWhiteSpace(smtpFromEmail))
                    smtpFromEmail = smtpUser;
                var smtpFromName = string.IsNullOrWhiteSpace(smtp.FromName) ? "Portal Intellium" : smtp.FromName.Trim();

                if (string.IsNullOrWhiteSpace(smtpHost)
                    || string.IsNullOrWhiteSpace(smtpUser)
                    || string.IsNullOrWhiteSpace(smtpPassword))
                {
                    return new ErrorResult("Mail ayarlari eksik. MailParameters veya appsettings Smtp ayarlarini kontrol edin.");
                }

                selectedMailParameters = new MailParameters
                {
                    SMTP = smtpHost,
                    User = smtpUser,
                    Password = smtpPassword,
                    Port = smtpPort,
                    SSL = smtpSsl,
                    FromEmail = smtpFromEmail,
                    FromName = smtpFromName
                };
            }

            SendMailDto sendMailDto = new SendMailDto()
            {
                MailParameters = selectedMailParameters,
                ToEmail = user.Email,
                Subject = subject,
                Body = templateBody

            };
            _mailService.SendMail(sendMailDto);
            return new SuccessResult(MailMessages.MailSendSuccesfull);
        }

        private string BuildMailBody(string templateFileName, string fullName, string link, string title, string message, string linkDescription)
        {
            var logoUrl = (_configuration["Links:MailLogoUrl"] ?? "").Trim();
            if (string.IsNullOrEmpty(logoUrl))
            {
                var appBase = _portalAppUrlProvider.GetAppBaseUrl();
                if (!string.IsNullOrEmpty(appBase))
                    logoUrl = $"{appBase}/favicon.png";
            }

            var templatePath = Path.Combine(AppContext.BaseDirectory, "EmailTemplates", templateFileName);
            if (System.IO.File.Exists(templatePath))
            {
                var html = System.IO.File.ReadAllText(templatePath);
                return html
                    .Replace("{{FullName}}", fullName)
                    .Replace("{{VerificationLink}}", link)
                    .Replace("{{ResetLink}}", link)
                    .Replace("{{LogoUrl}}", logoUrl)
                    .Replace("{{MailTitle}}", title)
                    .Replace("{{MailDescription}}", message)
                    .Replace("{{ActionText}}", linkDescription);
            }

            var mailTemplate = _mailTemplatesService.GetByTemplateName("Kayıt", 1);
            string templateBody = mailTemplate.Data.Value;
            templateBody = templateBody.Replace("{{title}}", title);
            templateBody = templateBody.Replace("{{message}}", message);
            templateBody = templateBody.Replace("{{link}}", link);
            templateBody = templateBody.Replace("{{linkDescription}}", linkDescription);
            return templateBody;
        }

        public IResult ChangePassword(User user, string newPassword)
        {
            byte[] passwordHash, passwordSalt;
            HashingHelper.CreatePasswordHash(newPassword, out passwordHash, out passwordSalt);

            user.PasswordHash = passwordHash;
            user.PasswordSalt = passwordSalt;

            _userService.Update(user);
            return new SuccessResult(UserMessages.PasswordChanged);
        }

        public IDataResult<User> GetByEmail(string email)
        {
            var user = _userService.GetByMail(email);
            return user == null
                ? new ErrorDataResult<User>(UserMessages.UserNotFound)
                : new SuccessDataResult<User>(user);
        }

        public IDataResult<User> GetById(long id)
        {
            return _userService.GetById(id);
        }

        public IResult Update(User user)
        {
            return _userService.Update(user);
        }
    }
}
