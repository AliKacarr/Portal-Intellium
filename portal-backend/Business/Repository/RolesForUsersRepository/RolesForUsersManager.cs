using Business.Repository.RolesForUsersRepository.Constants;
using Business.Repository.UserOperationClaimRepository;
using Business.Repository.UserRoleRepository;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.RolesForUsersRepository;
using Entities.Concrete;
using System.Linq;

namespace Business.Repository.RolesForUsersRepository
{
    public class RolesForUsersManager : IRolesForUsersService
    {

        private readonly IRolesForUsersDal _rolesForUsersDal;
        private readonly IUserRoleService _userRoleService;
        private readonly IUserOperationClaimService _userOperationClaimService;
        public RolesForUsersManager(IRolesForUsersDal rolesForUsersDal, IUserRoleService userRoleService, IUserOperationClaimService userOperationClaimService)
        {
            _rolesForUsersDal = rolesForUsersDal;
            _userRoleService = userRoleService;
            _userOperationClaimService = userOperationClaimService;
        }

        public IResult Add(RolesForUsers rolesForUsers)
        {
            _rolesForUsersDal.Add(rolesForUsers);

            #region operasyon bazlı yetkilendirme yapıldığı zaman bu yapı silinmeli. !!! Bu bir geçici yapıdır.
            _userOperationClaimService.Add(new()
            {
                UserId = rolesForUsers.UserId,
                OperationClaimId = rolesForUsers.RoleId
            });
            #endregion
            return new SuccessResult(RolesForUsersMessages.AddedRolesForUsers);

        }

        public IResult Delete(long id)
        {
            var result = _rolesForUsersDal.Get(x => x.Id == id);
            _rolesForUsersDal.Delete(result);
            return new SuccessResult(RolesForUsersMessages.DeletedRolesForUsers);

        }

        public IDataResult<List<RolesForUsers>> GetAll()
        {
            return new SuccessDataResult<List<RolesForUsers>>(_rolesForUsersDal.GetAll());
        }

        public IDataResult<List<RolesForUsers>> GetRolesForUsersByRoleId(long roleId)
        {
            var result = _rolesForUsersDal.GetAll(ru => ru.RoleId.Equals(roleId));
            if (!result.Any())
            {
                return new ErrorDataResult<List<RolesForUsers>>(RolesForUsersMessages.RolesForUsersNotFound);
            }
            return new SuccessDataResult<List<RolesForUsers>>(result);

        }

        public IDataResult<List<RolesForUsers>> GetAllRolesForUsersByRoleName(string roleName)
        {
            var roleResult = _userRoleService.GetByRoleName(roleName).Data;
            var result = _rolesForUsersDal.GetAll(ru => ru.RoleId.Equals(roleResult.Id));
            if (!result.Any())
            {
                return new ErrorDataResult<List<RolesForUsers>>(RolesForUsersMessages.RolesForUsersNotFound);
            }
            return new SuccessDataResult<List<RolesForUsers>>(result);
        }

        public IDataResult<RolesForUsers> GetRolesForUsersByUserId(long userId)
        {
            var result = _rolesForUsersDal.Get(ru => ru.UserId.Equals(userId));
            if (result == null)
            {
                return new ErrorDataResult<RolesForUsers>(RolesForUsersMessages.RolesForUsersNotFound);
            }
            return new SuccessDataResult<RolesForUsers>(result);

        }

        public IResult Update(RolesForUsers rolesForUsers)
        {
            _rolesForUsersDal.Update(rolesForUsers);

            #region operasyon bazlı yetkilendirme yapıldığı zaman bu yapı silinmeli. !!! Bu bir geçici yapıdır.
            // UserOperationClaims PK (Id) ile Users.UserId aynı değil; GetById(UserId) yanlış kaydı/null döner.
            var userOperationClaim = _userOperationClaimService.GetAll(rolesForUsers.UserId).Data?.FirstOrDefault();
            if (userOperationClaim != null)
            {
                userOperationClaim.OperationClaimId = rolesForUsers.RoleId;
                _userOperationClaimService.Update(userOperationClaim);
            }
            #endregion
            return new SuccessResult(RolesForUsersMessages.UpdatedRolesForUsers);

        }

        public IDataResult<string> GetRoleNameByUserId(long userId)
        {
            var result = _rolesForUsersDal.Get(ru => ru.UserId.Equals(userId));
            if (result == null)
                return new ErrorDataResult<string>(RolesForUsersMessages.RolesForUsersNotFound);

            var userRole = _userRoleService.GetByRoleId(result.RoleId).Data;
            return new SuccessDataResult<string>(userRole.RoleName);
            
        }
    }
}
