using Business.BusinessAspects;
using Business.Helpers;
using Business.Repository.UserProfileDetailRepository.Constans;
using Business.Repository.UserProfileDetailRepository.Validations;
using Core.Aspects.Autofac.Validation;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.UserJobDetailRepository;
using DataAccess.Repository.UserPermissionRepository;
using DataAccess.Repository.UserProfileDetailRepository;
using DataAccess.Repository.UserRepository;
using Entities.Concrete;
using Entities.DTOs.UserDetailDtos;

namespace Business.Repository.UserProfileDetailRepository
{
	public class UserProfileDetailsManager : IUserProfileDetailService
	{
		private readonly IUserProfileDetailDal _userProfileDetailDal;
		private readonly IUserContext _userContext;
		private readonly IUserPermissionDal _userPermissionDal;
		private readonly IUserJobDetailDal _userJobDetailDal;
		private readonly IUserDal _userDal;

		public UserProfileDetailsManager(
			IUserProfileDetailDal userProfileDetailDal, 
			IUserContext userContext,
			IUserPermissionDal userPermissionDal,
			IUserJobDetailDal userJobDetailDal,
			IUserDal userDal)
		{
			_userProfileDetailDal = userProfileDetailDal;
			_userContext = userContext;
			_userPermissionDal = userPermissionDal;
			_userJobDetailDal = userJobDetailDal;
			_userDal = userDal;
		}

		[LoggerAspect]
		[SecuredOperation(RoleNames.Admin)]
		[ValidationAspect(typeof(AddUserProfileDetailValidator))]
		public IResult Add(UserProfileDetails userProfileDetails)
		{
			// Aynı UserId için kayıt var mı kontrol et (upsert)
			var existing = _userProfileDetailDal.Get(x => x.UserId == userProfileDetails.UserId);
			if (existing != null)
			{
				userProfileDetails.Id = existing.Id;
				PreserveRequiredFieldsForUpdate(userProfileDetails, existing);
				NormalizeMilitaryFields(userProfileDetails);
				_userProfileDetailDal.Update(userProfileDetails);
				
				// Doğum Tarihine Göre İzin Güncelle
				RecalculateLeaveOnBirthDateChange(userProfileDetails);
				
				return new SuccessResult(UserProfileDetailsMessages.UpdatedUserProfileDetail);
			}

			ApplyRequiredFieldDefaults(userProfileDetails);
			NormalizeMilitaryFields(userProfileDetails);
			_userProfileDetailDal.Add(userProfileDetails);
			
			// İlk eklemede Doğum Tarihine Göre İzin Güncelle
			RecalculateLeaveOnBirthDateChange(userProfileDetails);
			
			return new SuccessResult(UserProfileDetailsMessages.AddedUserProfileDetail);
		}

		[LoggerAspect]
		[SecuredOperation(RoleNames.Admin)]
		[ValidationAspect(typeof(DeleteUserProfileDetailValidator))]
		public IResult Delete(long id)
		{
			var userprofile = _userProfileDetailDal.Get(x => x.Id == id);
			_userProfileDetailDal.Delete(userprofile);
			return new SuccessResult(UserProfileDetailsMessages.DeletedUserProfileDetail);
		}

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
		public IDataResult<BasicGeneralUserDetailDto> GetBasicGeneralUserDetailByUser()
		{
			long userId;
			try
			{
				userId = _userContext.UserId;
			}
			catch
			{
				// Claim okunamazsa (token/claim uyumsuzluğu vb.) UI'yı 400'e düşürme.
				return new SuccessDataResult<BasicGeneralUserDetailDto>(new BasicGeneralUserDetailDto());
			}

			// 1) Önce profileDetails tablosundan DTO
			var dto = _userProfileDetailDal.GetBasicGeneralUserDetailByUser(userId);
			if (dto != null)
				return new SuccessDataResult<BasicGeneralUserDetailDto>(dto);

			// 2) Kayıt yoksa: Users + JobDetails'dan fallback (UI hata vermesin)
			var user = _userDal.Get(u => u.Id == userId);
			if (user == null)
				return new SuccessDataResult<BasicGeneralUserDetailDto>(new BasicGeneralUserDetailDto());

			var job = _userJobDetailDal.Get(j => j.UserId == userId);
			return new SuccessDataResult<BasicGeneralUserDetailDto>(new BasicGeneralUserDetailDto
			{
				Name = user.Name,
				Surname = null,
				PreferredName = null,
				BirthDate = null,
				Sex = null,
				Country = null,
				Province = null,
				District = null,
				PostCode = null,
				Address = null,
				TelNo = null,
				Interphone = null,
				Office = null,
				JobTitle = job?.JobTitle
			});
		}

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.Worker},{RoleNames.Admin}")]
		public IDataResult<UserProfileDetails> GetUserProfileDetailsByUserId(long userId)
		{
			var userProfileDetails = _userProfileDetailDal.Get(x => x.UserId == userId);
			if (userProfileDetails == null)
			{
				return new ErrorDataResult<UserProfileDetails>(UserProfileDetailsMessages.UserProfileDetailNotFound);
			}
			return new SuccessDataResult<UserProfileDetails>(userProfileDetails);
		}

		[LoggerAspect]
		[SecuredOperation(RoleNames.Admin)]
		[ValidationAspect(typeof(UpdateUserProfileDetailValidator))]
		public IResult Update(UserProfileDetails userProfileDetails)
		{
			var existing = _userProfileDetailDal.Get(x => x.Id == userProfileDetails.Id);
			if (existing != null)
			{
				PreserveRequiredFieldsForUpdate(userProfileDetails, existing);
			}
			else
			{
				ApplyRequiredFieldDefaults(userProfileDetails);
			}

			NormalizeMilitaryFields(userProfileDetails);

			_userProfileDetailDal.Update(userProfileDetails);
			
			// Doğum Tarihine Göre İzin Güncelle
			RecalculateLeaveOnBirthDateChange(userProfileDetails);
			
			return new SuccessResult(UserProfileDetailsMessages.UpdatedUserProfileDetail);
		}

		private static void PreserveRequiredFieldsForUpdate(UserProfileDetails target, UserProfileDetails existing)
		{
			target.UserId = target.UserId == default ? existing.UserId : target.UserId;
			target.Adress = KeepRequiredString(target.Adress, existing.Adress);
			target.BankAccountNo = KeepRequiredString(target.BankAccountNo, existing.BankAccountNo);
			target.BankName = KeepRequiredString(target.BankName, existing.BankName);
			target.BirthDate = target.BirthDate == default ? existing.BirthDate : target.BirthDate;
			target.BirthPlace = KeepRequiredString(target.BirthPlace, existing.BirthPlace);
			target.BloodType = KeepRequiredString(target.BloodType, existing.BloodType);
			target.Condition = KeepRequiredString(target.Condition, existing.Condition);
			target.Country = KeepRequiredString(target.Country, existing.Country);
			target.District = KeepRequiredString(target.District, existing.District);
			target.HandicappedState = KeepRequiredString(target.HandicappedState, existing.HandicappedState, "Yok");
			target.IBANNo = KeepRequiredString(target.IBANNo, existing.IBANNo);
			target.MilitaryCase = KeepRequiredString(target.MilitaryCase, existing.MilitaryCase);
			target.Name = KeepRequiredString(target.Name, existing.Name);
			target.Nationality = KeepRequiredString(target.Nationality, existing.Nationality);
			target.PostCode = KeepRequiredString(target.PostCode, existing.PostCode);
			target.PreferredName = KeepRequiredString(target.PreferredName, existing.PreferredName);
			target.Province = KeepRequiredString(target.Province, existing.Province);
			target.Sex = KeepRequiredString(target.Sex, existing.Sex);
			target.Surname = KeepRequiredString(target.Surname, existing.Surname);
			target.TC = KeepRequiredString(target.TC, existing.TC);
			target.TelNo = KeepRequiredString(target.TelNo, existing.TelNo);
		}

		private static void ApplyRequiredFieldDefaults(UserProfileDetails userProfileDetails)
		{
			userProfileDetails.Adress ??= string.Empty;
			userProfileDetails.BankAccountNo ??= string.Empty;
			userProfileDetails.BankName ??= string.Empty;
			if (userProfileDetails.BirthDate == default)
			{
				userProfileDetails.BirthDate = new DateTime(1900, 1, 1);
			}
			userProfileDetails.BirthPlace ??= string.Empty;
			userProfileDetails.BloodType ??= string.Empty;
			userProfileDetails.Condition ??= string.Empty;
			userProfileDetails.Country ??= string.Empty;
			userProfileDetails.District ??= string.Empty;
			userProfileDetails.HandicappedState ??= "Yok";
			userProfileDetails.IBANNo ??= string.Empty;
			userProfileDetails.MilitaryCase ??= string.Empty;
			userProfileDetails.Name ??= string.Empty;
			userProfileDetails.Nationality ??= string.Empty;
			userProfileDetails.PostCode ??= string.Empty;
			userProfileDetails.PreferredName ??= string.Empty;
			userProfileDetails.Province ??= string.Empty;
			userProfileDetails.Sex ??= string.Empty;
			userProfileDetails.Surname ??= string.Empty;
			userProfileDetails.TC ??= string.Empty;
			userProfileDetails.TelNo ??= string.Empty;
		}

		private static string KeepRequiredString(string incoming, string existing, string fallback = "")
		{
			return incoming ?? existing ?? fallback;
		}

		private static void NormalizeMilitaryFields(UserProfileDetails userProfileDetails)
		{
			var sex = userProfileDetails.Sex?.Trim();
			var isMale = string.Equals(sex, "Erkek", StringComparison.OrdinalIgnoreCase)
			             || string.Equals(sex, "Male", StringComparison.OrdinalIgnoreCase);

			// Kadın (veya erkek olmayan) kullanıcılar için askerlik alanlarını boşalt.
			// DB tarafında MilitaryCase nullable olmadığı için null yerine boş string basıyoruz.
			if (!isMale)
			{
				userProfileDetails.MilitaryCase = string.Empty;
				userProfileDetails.MilitaryDate = null;
			}
		}

		// --- İZİN BAKIYESI HESAPLAMA ---
		private void RecalculateLeaveOnBirthDateChange(UserProfileDetails userProfileDetails)
		{
			// Doğum tarihi yoksa işlem yapmaya gerek yok
			if (userProfileDetails.BirthDate == default(DateTime)) return;

			// Kullanıcının iş detail bilgisini al (StartDate için)
			var userJobDetail = _userJobDetailDal.Get(j => j.UserId == userProfileDetails.UserId);
			
			// StartDate girilmişse hesaplamayı güncelle
			if (userJobDetail != null && userJobDetail.StartDate.HasValue)
			{
				DateTime startDate = userJobDetail.StartDate.Value;
				DateTime birthDate = userProfileDetails.BirthDate;

				int newThisYearLeave = UserPermissionCalculate.CalculateThisYearLeave(startDate, birthDate);
				int newTotalLeave = UserPermissionCalculate.CalculateTotalLeave(startDate, birthDate);
				var existingPermission = _userPermissionDal.GetUserPermissionByUserId(userProfileDetails.UserId);

				if (existingPermission != null)
				{
					// Doğum tarihi güncellendiğinde toplam aynı kalsa bile kalan izin sıfırdan hesaplanmalı.
					existingPermission.ThisYear = newThisYearLeave;
					existingPermission.TotalLeave = newTotalLeave;
					existingPermission.RemainingLeave = existingPermission.TotalLeave - existingPermission.UsedLeave;
					existingPermission.Year = DateTime.Now.Year;
					_userPermissionDal.Update(existingPermission);
				}
				else
				{
					_userPermissionDal.Add(new UserPermission
					{
						UserId = userProfileDetails.UserId,
						TotalLeave = newTotalLeave,
						RemainingLeave = newTotalLeave,
						UsedLeave = 0,
						ThisYear = newThisYearLeave,
						Year = DateTime.Now.Year
					});
				}
			}
		}
	}
}
