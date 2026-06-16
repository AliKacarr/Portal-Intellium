using Business.BusinessAspects;
using Business.Helpers;
using Business.Repository.UserPermissionRepository.Constans;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.HolidayRepository;
using DataAccess.Repository.PermissionRepository;
using DataAccess.Repository.PermissionTypeRepository;
using DataAccess.Repository.UserJobDetailRepository;
using DataAccess.Repository.UserPermissionRepository;
using DataAccess.Repository.UserProfileDetailRepository;
using Entities.Concrete;
using Entities.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Business.Repository.UserPermissionRepository
{
	public class UserPermissionManager : IUserPermissionService
	{
		private readonly IUserPermissionDal _userPermissionDal;
		private readonly IUserJobDetailDal _userJobDetailDal;
		private readonly IUserProfileDetailDal _userProfileDetailDal;
		private readonly IPermissionDal _permissionDal;
		private readonly IHolidayDal _holidayDal;
		private readonly IPermissionTypeDal _permissionTypeDal;

		public UserPermissionManager(
			IUserPermissionDal userPermissionDal,
			IUserJobDetailDal userJobDetailDal,
			IUserProfileDetailDal userProfileDetailDal,
			IPermissionDal permissionDal,
			IHolidayDal holidayDal,
			IPermissionTypeDal permissionTypeDal)
		{
			_userPermissionDal = userPermissionDal;
			_userJobDetailDal = userJobDetailDal;
			_userProfileDetailDal = userProfileDetailDal;
			_permissionDal = permissionDal;
			_holidayDal = holidayDal;
			_permissionTypeDal = permissionTypeDal;
		}

		// [SecuredOperation(RoleNames.Admin)]  <-- YORUM SATIRI YAPILDI (Kilit Açıldı)
		public IResult Add(UserPermission userPermission)
		{
			RecalculateFromJobAndProfile(userPermission);
			_userPermissionDal.Add(userPermission);
			return new SuccessResult(UserPermissionMessages.AddedUserPermission);
		}

		// [SecuredOperation(RoleNames.Admin)] <-- YORUM SATIRI YAPILDI
		public IResult Delete(UserPermission userPermission)
		{
			_userPermissionDal.Delete(userPermission);
			return new SuccessResult(UserPermissionMessages.DeletedUserPermission);
		}

		// [SecuredOperation(RoleNames.Admin)] <-- YORUM SATIRI YAPILDI
		public IDataResult<List<UserPermission>> GetAll()
		{
			return new SuccessDataResult<List<UserPermission>>(_userPermissionDal.GetAll());
		}

		// [SecuredOperation(RoleNames.Admin)] <-- EN ÖNEMLİSİ BU! (Kartların verisi buradan geliyor)
		public IDataResult<UserPermission> GetUserPermissionById(int userId)
		{
			var permission = _userPermissionDal.GetUserPermissionByUserId(userId);
			if (permission == null)
			{
				return new SuccessDataResult<UserPermission>(null);
			}

			var jobDetail = _userJobDetailDal.Get(j => j.UserId == userId);
			if (jobDetail?.StartDate != null)
			{
				var profile = _userProfileDetailDal.Get(p => p.UserId == userId);
				DateTime birthDate = profile?.BirthDate ?? default;

				int recalculatedThisYear = UserPermissionCalculate.CalculateThisYearLeave(jobDetail.StartDate.Value, birthDate);
				int recalculatedTotalLeave = UserPermissionCalculate.CalculateTotalLeave(jobDetail.StartDate.Value, birthDate);

				// NEDEN SADECE ThisYear ve TotalLeave senkronize ediliyor?
				// RemainingLeave artık dokunulmuyor çünkü:
				//   1. Admin "İzin Bakiyesi Yönetimi" sayfasından manuel override yapabilir.
				//   2. ConfirmPermission / DeclinePermission zaten RemainingLeave'i
				//      UsedLeave üzerinden doğrudan güncelliyor.
				// Burada RemainingLeave'i formülle ezersek admin'in girdiği değer
				// kullanıcı izin formunu her açtığında sıfırlanır.
				if (permission.ThisYear != recalculatedThisYear ||
					permission.TotalLeave != recalculatedTotalLeave)
				{
					permission.ThisYear = recalculatedThisYear;
					permission.TotalLeave = recalculatedTotalLeave;
					// RemainingLeave kasıtlı olarak DOKUNULMADI
					permission.Year = DateTime.Now.Year;
					_userPermissionDal.Update(permission);
				}
			}

			return new SuccessDataResult<UserPermission>(permission);
		}

		// [SecuredOperation(RoleNames.Admin)] <-- YORUM SATIRI YAPILDI
		public IResult Update(UserPermission userPermission)
		{
			RecalculateFromJobAndProfile(userPermission);
			_userPermissionDal.Update(userPermission);
			return new SuccessResult(UserPermissionMessages.UpdatedUserPermission);
		}

		/// <summary>
		/// Admin'in manuel bakiye güncellemesi için özel metod.
		/// RecalculateFromJobAndProfile ÇAĞIRILMAZ → Admin'in girdiği
		/// RemainingLeave ve TotalLeave değerleri direkt kaydedilir.
		/// Negatif değer de girilebilir (kasıtlı olarak kısıtlanmamış).
		/// </summary>
		public IResult AdminUpdateLeaveBalance(UserPermission userPermission)
		{
			userPermission.Year = DateTime.Now.Year;
			_userPermissionDal.Update(userPermission);
			return new SuccessResult("İzin bakiyesi başarıyla güncellendi.");
		}

		private void RecalculateFromJobAndProfile(UserPermission permission)
		{
			var jobDetail = _userJobDetailDal.Get(j => j.UserId == permission.UserId);
			if (jobDetail?.StartDate == null) return;

			var profile = _userProfileDetailDal.Get(p => p.UserId == permission.UserId);
			DateTime birthDate = profile?.BirthDate ?? default;

			permission.ThisYear = UserPermissionCalculate.CalculateThisYearLeave(jobDetail.StartDate.Value, birthDate);
			permission.TotalLeave = UserPermissionCalculate.CalculateTotalLeave(jobDetail.StartDate.Value, birthDate);
			permission.RemainingLeave = permission.TotalLeave - permission.UsedLeave;
			permission.Year = DateTime.Now.Year;
		}

		public IDataResult<LeaveEntitlementExplanationDto> GetLeaveEntitlementExplanation(int userId)
		{
			var dto = new LeaveEntitlementExplanationDto
			{
				RulesTable = LeaveRuleTableRows.Default
			};

			var typeById = _permissionTypeDal.GetAll().ToDictionary(t => t.Id, t => t);
			dto.UsedLeaveSummary = BuildUsedLeaveSummary(userId, typeById);
			dto.UsedLeaveDetails = BuildUsedLeaveDetails(userId, typeById);

			var jobDetail = _userJobDetailDal.Get(j => j.UserId == userId);
			if (jobDetail?.StartDate == null)
			{
				dto.HasJobStartDate = false;
				return new SuccessDataResult<LeaveEntitlementExplanationDto>(dto);
			}

			dto.HasJobStartDate = true;
			dto.JobStartDate = jobDetail.StartDate.Value.Date;
			var profile = _userProfileDetailDal.Get(p => p.UserId == userId);
			DateTime birthDate = profile?.BirthDate ?? default;
			dto.BirthDate = birthDate == default ? null : birthDate.Date;

			dto.ThisYearDetail = UserPermissionCalculate.BuildThisYearDetail(jobDetail.StartDate.Value, birthDate);
			dto.AnnualAccruals = UserPermissionCalculate.BuildAnnualAccruals(jobDetail.StartDate.Value, birthDate);

			return new SuccessDataResult<LeaveEntitlementExplanationDto>(dto);
		}

		private List<LeaveUsedSummaryItemDto> BuildUsedLeaveSummary(long userId, Dictionary<int, PermissionTypes> typeById)
		{
			var permissions = _permissionDal.GetPermissionByUserId(userId)
				.Where(p => p.Status == "Confirmed")
				.ToList();

			var groups = permissions.GroupBy(p => p.PermissionTypeId);
			var list = new List<LeaveUsedSummaryItemDto>();
			foreach (var g in groups)
			{
				double total = 0;
				foreach (var p in g)
				{
					double d = UserPermissionCalculate.CalculateTotalWorkingDays(p.StartTime, p.EndTime, _holidayDal, p.PermissionTypeId);
					total += d;
				}

				typeById.TryGetValue(g.Key, out var pt);
				list.Add(new LeaveUsedSummaryItemDto
				{
					PermissionTypeName = PermissionTypeHelper.GetPermissionTypeDisplayName(g.Key, pt?.SubPermission),
					TotalDays = Math.Round(total, 2),
					RequestCount = g.Count()
				});
			}

			return list.OrderByDescending(x => x.TotalDays).ToList();
		}

		private List<LeaveUsedDetailItemDto> BuildUsedLeaveDetails(long userId, Dictionary<int, PermissionTypes> typeById)
		{
			var permissions = _permissionDal.GetPermissionByUserId(userId)
				.OrderByDescending(p => p.StartTime)
				.ToList();

			var list = new List<LeaveUsedDetailItemDto>();
			foreach (var p in permissions)
			{
				typeById.TryGetValue(p.PermissionTypeId, out var pt);
				bool isHourly = PermissionTypeHelper.IsHourly(p.PermissionTypeId, pt?.SubPermission, pt?.DurationUnit);
				double amount;
				string unit;

				if (isHourly)
				{
					amount = Math.Round((p.EndTime - p.StartTime).TotalHours, 2);
					unit = "saat";
				}
				else
				{
					amount = Math.Round(UserPermissionCalculate.CalculateTotalWorkingDays(p.StartTime, p.EndTime, _holidayDal, p.PermissionTypeId), 2);
					unit = "gün";
				}

				list.Add(new LeaveUsedDetailItemDto
				{
					PermissionId = (int)p.Id,
					PermissionTypeName = PermissionTypeHelper.GetPermissionTypeDisplayName(p.PermissionTypeId, pt?.SubPermission),
					StartTime = p.StartTime,
					EndTime = p.EndTime,
					Amount = amount,
					Unit = unit,
					Status = p.Status ?? "Pending",
					StatusLabel = MapStatusLabel(p.Status)
				});
			}

			return list;
		}

		private static string MapStatusLabel(string? status)
		{
			if (string.IsNullOrWhiteSpace(status)) return "Beklemede";
			return status switch
			{
				"Confirmed" => "Onaylandı",
				"Declined" => "Reddedildi",
				"Pending" => "Beklemede",
				_ => status
			};
		}
	}
}