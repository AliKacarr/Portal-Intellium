using Business.Repository.UserProfileDetailRepository.Constans;
using Business.Repository.RolesForUsersRepository;
using Business.Repository.UserRepository.Constants;
using DataAccess.Repository.UserRepository;
using Entities.Concrete;
using FluentValidation;

namespace Business.Repository.UserProfileDetailRepository.Validations
{
	public class AddUserProfileDetailValidator : AbstractValidator<UserProfileDetails>
	{
		private readonly IUserDal _userDal;
		private readonly IRolesForUsersService _rolesForUsersService;
		public AddUserProfileDetailValidator(IUserDal userDal, IRolesForUsersService rolesForUsersService)
		{
			_userDal = userDal;
			_rolesForUsersService = rolesForUsersService;

			RuleFor(p => p.UserId)
				.Must(UserExists)
				.WithMessage(UserMessages.UserNotFound);

			When(p => !IsUserRole(p.UserId), () =>
			{
				RuleFor(p => p.TC).NotEmpty().WithMessage(UserProfileDetailsMessages.TCEmptyMessage)
					.Length(11).WithMessage(UserProfileDetailsMessages.TCInvalidLengthMessage);

				RuleFor(p => p.IBANNo)
					.Cascade(CascadeMode.Stop)
					.NotEmpty().WithMessage(UserProfileDetailsMessages.IBANEmpty)
					.Must(iban => iban.StartsWith("TR")).WithMessage(UserProfileDetailsMessages.IBANMustStartWithTR)
					.Must(iban => iban.Length == 26).WithMessage(UserProfileDetailsMessages.IBANLengthMustBe26);
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

		private bool UserExists(long userId)
		{
			return _userDal.Get(u => u.Id == userId) != null;
		}
	}
}
