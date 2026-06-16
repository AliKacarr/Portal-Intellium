using Business.BusinessAspects;
using Business.File;
using Business.Repository.RolesForUsersRepository;
using Business.Repository.UserCustomerRepository;
using Business.Repository.UserRepository.Constants;
using Business.Repository.UserRepository.Validation;
using Core.Aspects.Autofac.Validation;
using Core.Identity;
using Core.Utilities.Hashing;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.UserJobDetailRepository;
using DataAccess.Repository.UserPermissionRepository;
using DataAccess.Repository.UserProfileDetailRepository;
using DataAccess.Repository.UserRepository;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;
using Entities.DTOs.UserDtos;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.IdentityModel.Tokens;
using IResult = Core.Utilities.Results.Abstract.IResult;
using Business.Helpers; // <-- Helper sınıfını unutma

namespace Business.Repository.UserRepository
{
    public class UserManager : IUserService
    {
        private readonly IUserDal _userDal;
        private readonly IUserPermissionDal _userPermissionDal;
        private readonly IUserCustomerService _userCustomerService;
        private readonly IRolesForUsersService _rolesForUsersService;
        private readonly IFileService _fileService;
        private readonly IUserProfileDetailDal _userProfileDetailDal;
        private readonly IUserJobDetailDal _userJobDetailDal;
        private readonly PortalContext _portalContext;

        public UserManager(IUserDal userDal, IUserPermissionDal userPermissionDal, IUserCustomerService userCustomerService, IRolesForUsersService rolesForUsersService, IFileService fileService, IUserProfileDetailDal userProfileDetailDal, IUserJobDetailDal userJobDetailDal, PortalContext portalContext)
        {
            _userDal = userDal;
            _userPermissionDal = userPermissionDal;
            _userCustomerService = userCustomerService;
            _rolesForUsersService = rolesForUsersService;
            _fileService = fileService;
            _userProfileDetailDal = userProfileDetailDal;
            _userJobDetailDal = userJobDetailDal;
            _portalContext = portalContext;
        }

        private DateTime GetUserBirthDate(long userId)
        {
            var profile = _userProfileDetailDal.Get(p => p.UserId == userId);
            return profile?.BirthDate ?? default;
        }

        [ValidationAspect(typeof(UserValidator))]
        public IResult Add(User user)
        {
            if (user.AddetAt == DateTime.MinValue)
                user.AddetAt = DateTime.UtcNow;

            _userDal.Add(user);

            // Başlama tarihi henüz bilinmiyor; StartDate UserJobDetail'da sonradan girilir.
            // İzin hesabı UserJobDetailManager.Update() tetiklendiğinde yapılacak.
            UserPermission userPermission = new UserPermission
            {
                UserId = user.Id,
                TotalLeave = 0,
                RemainingLeave = 0,
                UsedLeave = 0,
                ThisYear = 0,
                Year = DateTime.Now.Year
            };

            _userPermissionDal.Add(userPermission);
            return new SuccessResult(UserMessages.AddedUser);
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        public IDataResult<List<UserDto>> GetAll()
        {
            return new SuccessDataResult<List<UserDto>>(_userDal.GetAllForUserList());
        }

        public User GetByConfirmValue(string value) { return _userDal.Get(p => p.ConfirmValue == value); }
        public User GetByMail(string email) { return _userDal.Get(p => p.Email.ToLower() == email.ToLower()); }
        [LoggerAspect]
        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        public IDataResult<List<UserDto>> GetByName(string name) { return new SuccessDataResult<List<UserDto>>(_userDal.GetByName(name)); }
        public IDataResult<List<OperationClaim>> GetOperationClaims(User user, long customerId) { return new SuccessDataResult<List<OperationClaim>>(_userDal.GetClaims(user, customerId)); }
        [LoggerAspect]
        [SecuredOperation($"{RoleNames.Worker},{RoleNames.Admin}")]
        public IDataResult<UserDto> GetUserAsDtoById(long id) { return new SuccessDataResult<UserDto>(_userDal.GetUserAsDtoById(id)); }
        public IDataResult<User> GetById(long id)
        {
            var result = _userDal.Get(p => p.Id == id);
            if (result == null) return new ErrorDataResult<User>(UserMessages.UserNotFound);
            return new SuccessDataResult<User>(result, UserMessages.GetUser);
        }
        public IResult Update(User user) { _userDal.Update(user); return new SuccessResult(UserMessages.UpdatedUser); }
        public IResult DoesUserExist(long userId)
        {
            var result = _userDal.Get(p => p.Id == userId);
            if (result != null) return new SuccessResult(UserMessages.UserAlreadyExist);
            return new ErrorResult();
        }

        [LoggerAspect]
        [SecuredOperation(RoleNames.Admin)]
        public IResult UpdateAsDto(EditUserDto editUser)
        {
            var updatedUser = _userDal.Get(user => user.Id.Equals(editUser.Id));
            if (updatedUser == null) return new ErrorResult(UserMessages.UserNotFound);

            // KORUMA: Eğer Frontend'den isim boş gelirse, veritabanındakini bozma!
            if (!string.IsNullOrEmpty(editUser.Name)) updatedUser.Name = editUser.Name;
            if (!string.IsNullOrEmpty(editUser.Email)) updatedUser.Email = editUser.Email;
            if (!string.IsNullOrEmpty(editUser.Language)) updatedUser.Language = editUser.Language;

            // IsActive her zaman güncellenebilir (true/false)
            updatedUser.IsActive = editUser.IsActive;

            // --- TARİHLERİ GÜNCELLE ---
            if (editUser.AddetAt != DateTime.MinValue)
                updatedUser.AddetAt = editUser.AddetAt;

            if (editUser.BirthDate != DateTime.MinValue)
            {
                var profile = _userProfileDetailDal.Get(p => p.UserId == updatedUser.Id);
                if (profile != null)
                {
                    profile.BirthDate = editUser.BirthDate;
                    _userProfileDetailDal.Update(profile);

                    var jobDetail = _userJobDetailDal.Get(j => j.UserId == updatedUser.Id);
                    if (jobDetail?.StartDate != null)
                    {
                        DateTime startDate = jobDetail.StartDate.Value;
                        int newThisYearLeave = UserPermissionCalculate.CalculateThisYearLeave(startDate, profile.BirthDate);
                        int newTotalLeave = UserPermissionCalculate.CalculateTotalLeave(startDate, profile.BirthDate);

                        var userPermission = _userPermissionDal.GetUserPermissionByUserId(updatedUser.Id);
                        if (userPermission != null)
                        {
                            userPermission.ThisYear = newThisYearLeave;
                            userPermission.TotalLeave = newTotalLeave;
                            userPermission.RemainingLeave = userPermission.TotalLeave - userPermission.UsedLeave;
                            _userPermissionDal.Update(userPermission);
                        }
                    }
                }
            }

            // Şifre işlemleri
            if (!editUser.NewPassword.IsNullOrEmpty())
            {
                byte[] passwordHash, passwordSalt;
                HashingHelper.CreatePasswordHash(editUser.NewPassword!, out passwordHash, out passwordSalt);
                updatedUser.PasswordHash = passwordHash;
                updatedUser.PasswordSalt = passwordSalt;
            }

            // Müşteri ve Rol işlemleri
            if (editUser.CustomerId > 0)
            {
                var userCustomerData = _userCustomerService.GetByUserId(updatedUser.Id);
                if (userCustomerData.Data != null)
                {
                    var userCustomer = userCustomerData.Data;
                    userCustomer.CustomerId = editUser.CustomerId;
                    _userCustomerService.Update(userCustomer);
                }
            }

            if (editUser.UserRoleId > 0)
            {
                var roleForUserData = _rolesForUsersService.GetRolesForUsersByUserId(updatedUser.Id);
                if (roleForUserData.Data != null)
                {
                    var roleForUser = roleForUserData.Data;
                    roleForUser.RoleId = editUser.UserRoleId;
                    _rolesForUsersService.Update(roleForUser);
                }
            }

            // İzin hesabı artık UserJobDetailManager.Update() içinde yapılıyor.
            // Orada StartDate + BirthDate kullanılarak doğru kıdem hesaplanıyor.

            _userDal.Update(updatedUser);
            return new SuccessResult(UserMessages.UpdatedUser);
        }

        [LoggerAspect]
        [SecuredOperation(RoleNames.Admin)]
        public async Task<IResult> ChangeImage(IFormFile image, long userId)
        {
            var user = _userDal.Get(u => u.Id.Equals(userId));
            if (user == null) return new ErrorResult(UserMessages.UserNotFound);
            if (!user.ImageUrl.IsNullOrEmpty()) _fileService.Delete(user.ImageUrl!, FileType.PROFILE_IMAGE);
            var result = await _fileService.Save(image, FileType.PROFILE_IMAGE);
            user.ImageUrl = result.Data.FilePath;
            _userDal.Update(user);
            return new SuccessResult(UserMessages.ChangedProfileImage);
        }

        [LoggerAspect]
        [SecuredOperation(RoleNames.Admin)]
        public IResult RemoveImage(long userId)
        {
            var user = _userDal.Get(u => u.Id.Equals(userId));
            if (user == null) return new ErrorResult(UserMessages.UserNotFound);
            if (!user.ImageUrl.IsNullOrEmpty()) _fileService.Delete(user.ImageUrl!, FileType.PROFILE_IMAGE);
            user.ImageUrl = null;
            _userDal.Update(user);
            return new SuccessResult(UserMessages.RemovedImage);
        }

        [LoggerAspect]
        [SecuredOperation(RoleNames.Admin)]
        public async Task<IResult> HardDeleteUser(long userId)
        {
            var user = await _portalContext.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return new ErrorResult(UserMessages.UserNotFound);

            await using var transaction = await _portalContext.Database.BeginTransactionAsync();
            try
            {
                var userEntityType = _portalContext.Model.FindEntityType(typeof(User));
                if (userEntityType == null)
                    return new ErrorResult("Kullanıcı model bilgisi okunamadı.");

                var foreignKeysToUser = _portalContext.Model
                    .GetEntityTypes()
                    .SelectMany(entityType => entityType.GetForeignKeys())
                    .Where(fk => fk.PrincipalEntityType == userEntityType && fk.Properties.Count == 1)
                    .ToList();

                foreach (var fk in foreignKeysToUser)
                {
                    var dependentType = fk.DeclaringEntityType;
                    var tableName = dependentType.GetTableName();
                    if (string.IsNullOrWhiteSpace(tableName)) continue;

                    var schema = dependentType.GetSchema();
                    var storeObject = StoreObjectIdentifier.Table(tableName, schema);
                    var fkProperty = fk.Properties[0];
                    var columnName = fkProperty.GetColumnName(storeObject) ?? fkProperty.Name;
                    var userTableName = userEntityType.GetTableName();
                    if (tableName == userTableName) continue;

                    var qualifiedTableName = string.IsNullOrWhiteSpace(schema)
                        ? $"\"{tableName}\""
                        : $"\"{schema}\".\"{tableName}\"";

                    await _portalContext.Database.ExecuteSqlRawAsync(
                        $"DELETE FROM {qualifiedTableName} WHERE \"{columnName}\" = {{0}}",
                        userId
                    );
                }

                if (!user.ImageUrl.IsNullOrEmpty())
                {
                    _fileService.Delete(user.ImageUrl!, FileType.PROFILE_IMAGE);
                }

                _portalContext.Users.Remove(user);
                await _portalContext.SaveChangesAsync();
                await transaction.CommitAsync();
                return new SuccessResult(UserMessages.DeletedUser);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return new ErrorResult($"Kullanıcı silinemedi: {ex.Message}");
            }
        }
    }
}
