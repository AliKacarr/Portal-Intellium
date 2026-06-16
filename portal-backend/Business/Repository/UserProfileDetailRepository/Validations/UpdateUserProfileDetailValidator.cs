using Business.Repository.UserProfileDetailRepository.Constans;
using Business.Repository.RolesForUsersRepository;
using Business.Repository.UserRepository.Constants;
using DataAccess.Repository.UserProfileDetailRepository;
using DataAccess.Repository.UserRepository;
using Entities.Concrete;
using FluentValidation;

namespace Business.Repository.UserProfileDetailRepository.Validations
{
	public class UpdateUserProfileDetailValidator : AbstractValidator<UserProfileDetails>
	{
		private readonly IUserProfileDetailDal _userProfileDetailDal;
		private readonly IUserDal _userDal;
		private readonly IRolesForUsersService _rolesForUsersService;

		public UpdateUserProfileDetailValidator(IUserProfileDetailDal userProfileDetailDal, IUserDal userDal, IRolesForUsersService rolesForUsersService)
		{
			_userProfileDetailDal = userProfileDetailDal;
			_userDal = userDal;
			_rolesForUsersService = rolesForUsersService;

			RuleFor(userProfile => userProfile.Id).Must(UserProfileDetailExists).WithMessage(UserProfileDetailsMessages.UserProfileDetailNotFound);
			RuleFor(p => p.UserId).Must(UserExists).WithMessage(UserMessages.UserNotFound);
			When(p => !IsUserRole(p.UserId), () =>
			{
				RuleFor(p => p.TC).Length(11).WithMessage(UserProfileDetailsMessages.TCInvalidLengthMessage);
			});

			// Askerlik bilgisi sadece erkek kullanıcılar için zorunlu olmalı
			When(p => !IsUserRole(p.UserId) && IsMale(p.Sex), () =>
			{
				RuleFor(p => p.MilitaryCase)
					.NotEmpty()
					.WithMessage(UserProfileDetailsMessages.MilitaryCaseRequiredForMale);
			});
		}

		private static bool IsMale(string? sex)
		{
			if (string.IsNullOrWhiteSpace(sex)) return false;
			return string.Equals(sex.Trim(), "Erkek", StringComparison.OrdinalIgnoreCase)
			       || string.Equals(sex.Trim(), "Male", StringComparison.OrdinalIgnoreCase);
		}

		private bool IsUserRole(long userId)
		{
			var roleResult = _rolesForUsersService.GetRoleNameByUserId(userId);
			return string.Equals(roleResult.Data, "user", StringComparison.OrdinalIgnoreCase);
		}

		private bool UserProfileDetailExists(long id)
		{
			return _userProfileDetailDal.Get(u => u.Id == id) != null;
		}

		private bool UserExists(long userId)
		{
			return _userDal.Get(u => u.Id == userId) != null;
		}
	}
}
