using Business.BusinessAspects;
using Business.Repository.OperationClaimRepository;
using Business.Repository.UserRoleRepository.Constants;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.UserRoleRepository;
using Entities.Concrete;

namespace Business.Repository.UserRoleRepository
{
	public class UserRoleManager : IUserRoleService
	{
		private readonly IUserRoleDal _userRoleDal;
		private readonly IOperationClaimService _operationClaimService;

		public UserRoleManager(IUserRoleDal userRoleDal, IOperationClaimService operationClaimService)
		{
			_userRoleDal = userRoleDal;
			_operationClaimService = operationClaimService;
		}

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
		public IResult Add(UserRole userRole)
		{
			var roleResult = _userRoleDal.Get(r => r.RoleName.Equals(userRole.RoleName.ToLower()));
			if (roleResult != null)
			{
				return new ErrorResult(UserRoleMessages.UserRoleAlreadyExists);
			}
			userRole.RoleName = userRole.RoleName.ToLower();
			_userRoleDal.Add(userRole);

			#region operasyon bazlı yetkilendirme yapıldığı zaman bu yapı değişmeli. 
			// Role bağlı operation claimler olmalı ve user operation claim silinmeli.
			_operationClaimService.Add(userRole.RoleName);
			#endregion

			return new SuccessResult(UserRoleMessages.AddedUserRole);
		}

		[LoggerAspect]
		[SecuredOperation(RoleNames.Admin)]
		public IResult Delete(long id)
		{
			var result = _userRoleDal.Get(x => x.Id == id);
			if (result == null)
			{
				return new ErrorResult(UserRoleMessages.UserRoleNotFound);
			}
			_userRoleDal.Delete(result);
			return new SuccessResult(UserRoleMessages.DeletedUserRole);
		}

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.Worker},{RoleNames.Admin}")]
		public IDataResult<List<UserRole>> GetAll()
		{
			return new SuccessDataResult<List<UserRole>>(_userRoleDal.GetAll());
		}

		public IDataResult<UserRole> GetByRoleId(long id)
		{
			var roleResult = _userRoleDal.Get(r => r.Id.Equals(id));
			if (roleResult == null) return new ErrorDataResult<UserRole>();

			return new SuccessDataResult<UserRole>(roleResult);
		}

		public IDataResult<UserRole> GetByRoleName(string roleName)
		{
			var roleResult = _userRoleDal.Get(r => r.RoleName.Equals(roleName));
			if (roleResult == null) return new ErrorDataResult<UserRole>();

			return new SuccessDataResult<UserRole>(roleResult);
		}

		[LoggerAspect]
		[SecuredOperation(RoleNames.Admin)]
		public IResult Update(UserRole userRole)
		{
			var roleResult = _userRoleDal.Get(r => r.Id.Equals(userRole.Id));
			if (roleResult == null)
			{
				return new ErrorResult(UserRoleMessages.UserRoleNotFound);
			}

			userRole.RoleName = userRole.RoleName.ToLower();
			_userRoleDal.Update(userRole);
			return new SuccessResult(UserRoleMessages.UpdatedUserRole);
		}
	}
}
