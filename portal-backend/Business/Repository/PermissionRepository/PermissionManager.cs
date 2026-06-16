using Business.BusinessAspects; // ✅ LoggerAspect buradan gelir
using Business.Helpers;
using Business.Helpers.PermissionPdfGenerators;
using Business.Repository.NotificationRepository;
using Business.Repository.PermissionRepository.Constans;
using Business.Repository.RolesForUsersRepository;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.HolidayRepository;
using DataAccess.Repository.LeaveDeducationRepository;
using DataAccess.Repository.PermissionRepository;
using DataAccess.Repository.UserJobDetailRepository;
using DataAccess.Repository.UserPermissionRepository;
using DataAccess.Repository.UserRepository;
using DataAccess.Repository.PermissionTypeRepository;
using Entities.Concrete;
using Entities.DTOs;
using Entities.DTOs.NotificationDtos;
using Entities.Enums;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using IResult = Core.Utilities.Results.Abstract.IResult;

namespace Business.Repository.PermissionRepository
{
    public class PermissionManager : IPermissionService
    {
        private readonly IPermissionDal _permissionDal;
        private readonly IUserPermissionDal _userPermissionDal;
        private readonly IHolidayDal _holidayDal;
        private readonly ILeaveDeducationDal _leaveDeducationDal;
        private readonly IUserDal _userDal;
        private readonly PermissionHelpers _permissionHelpers;
        private readonly PermissionPdfGenerator _permissionPdfGenerator;
        private readonly INotificationService _notificationService;
        private readonly IRolesForUsersService _rolesForUsersService;
        private readonly IUserJobDetailDal _userJobDetailDal;
        private readonly IPermissionTypeDal _permissionTypeDal;

        public PermissionManager(
            IPermissionDal permissionDal, 
            IUserPermissionDal userPermissionDal, 
            IHolidayDal holidayDal, 
            ILeaveDeducationDal leaveDeducationDal, 
            IUserDal userDal, 
            PermissionHelpers permissionHelpers, 
            PermissionPdfGenerator permissionPdfGenerator, 
            IRolesForUsersService rolesForUsersService, 
            INotificationService notificationService,
            IUserJobDetailDal userJobDetailDal,
            IPermissionTypeDal permissionTypeDal)
        {
            _permissionDal = permissionDal;
            _userPermissionDal = userPermissionDal;
            _holidayDal = holidayDal;
            _leaveDeducationDal = leaveDeducationDal;
            _userDal = userDal;
            _permissionHelpers = permissionHelpers;
            _permissionPdfGenerator = permissionPdfGenerator;
            _notificationService = notificationService;
            _rolesForUsersService = rolesForUsersService;
            _userJobDetailDal = userJobDetailDal;
            _permissionTypeDal = permissionTypeDal;
        }

        // 🔥 LOGLAMA EKLENDİ: İzin talebi oluşturulduğunda log düşer.
        [LoggerAspect] 
        // [SecuredOperation(RoleNames.Admin)] // İstersen açabilirsin
        public IResult Add(Permission permission, IFormFile? documentFile)
        {
            // 1. KULLANICI İZİN BAKİYESİ KONTROLÜ
            UserPermission userPermission = _userPermissionDal.GetUserPermissionByUserId(permission.UserId);
            if (userPermission == null) return new ErrorResult("Sisteme tanımlı izin bakiyeniz bulunmamaktadır.");

            // 2. İZİN ARALIĞI KONTROLÜ
            var leaveDeductionHelpers = new LeaveDeducationHelpers(_leaveDeducationDal);
            var permissionCategory = PermissionTypeHelper.GetPermissionCategory(permission.PermissionTypeId);
            // LeaveDeducation tablosundaki max-day kontrolü mazeret tipi için geçerlidir.
            // Ücretli/ücretsiz izinleri burada engellemek gereksiz 400 hatasına sebep olur.
            if (permissionCategory == "Mazeret" &&
                !leaveDeductionHelpers.IsPermissionWithinDeductionRange(permissionCategory, permission.StartTime, permission.EndTime))
            {
                return new ErrorResult(PermissionMessages.OutOfRange);
            }

            // SADECE TATİL/HAFTASONU ENGELİ
            double actualLeaveDays = UserPermissionCalculate.CalculateActualLeaveDays(permission.StartTime, permission.EndTime, _holidayDal);
            if (actualLeaveDays == 0)
            {
                return new ErrorResult("Resmi tatil günleri için izin talebi oluşturulamaz");
            }

            // 3. TARİH ÇAKIŞMA KONTROLÜ
            var existingPermissions = _permissionDal.GetPermissionByUserId(permission.UserId);
            var overlappingPermissions = existingPermissions.Where(p =>
                p.Status != "Declined" &&
                permission.StartTime < p.EndTime &&
                permission.EndTime > p.StartTime
            ).ToList();

            var permissionTypeEntity = _permissionTypeDal.Get(x => x.Id == permission.PermissionTypeId);

            if (overlappingPermissions.Any())
            {
                bool isNewPriority = permissionTypeEntity?.IsPriority ?? false;

                if (!isNewPriority)
                {
                    return new ErrorResult("Seçilen tarih aralığında zaten bir izin talebiniz var.");
                }

                // Öncelikli izinler için, çakışan izinlerin de öncelikli olup olmadığını kontrol et
                var overlappingTypeIds = overlappingPermissions.Select(p => p.PermissionTypeId).Distinct().ToList();
                bool hasPriorityOverlap = false;

                foreach (var typeId in overlappingTypeIds)
                {
                    var overlappingType = _permissionTypeDal.Get(x => x.Id == typeId);
                    if (overlappingType != null && overlappingType.IsPriority)
                    {
                        hasPriorityOverlap = true;
                        break;
                    }
                }

                if (hasPriorityOverlap)
                {
                    return new ErrorResult("Seçilen tarih aralığında zaten öncelikli bir izin talebiniz bulunmaktadır.");
                }
            }

            var durationCheck = ValidateRequestedDurationAgainstPermissionType(permission, permissionTypeEntity);
            if (!durationCheck.Success) return durationCheck;

            // --- HESAPLAMA ---
            double totalAmount = UserPermissionCalculate.CalculateTotalWorkingDays(permission.StartTime, permission.EndTime, _holidayDal, permission.PermissionTypeId);
            if (PermissionTypeHelper.IsHourly(permission.PermissionTypeId, permissionTypeEntity?.SubPermission, permissionTypeEntity?.DurationUnit))
            {
                 TimeSpan diff = permission.EndTime - permission.StartTime;
                 totalAmount = diff.TotalHours;
            }

            // 4. AVANS İZİN KONTROLÜ
            if (PermissionTypeHelper.IsSubjectToAdvanceCheck(permission.PermissionTypeId))
            {
                var available = userPermission.RemainingLeave;
                if (totalAmount > available)
                {
                    if (!permission.IsAdvanceApproved) return new ErrorResult("NOT_ENOUGH_LEAVE"); 
                    permission.IsAdvanceLeave = true;
                    permission.AdvanceLeaveConsentAt = DateTime.Now;
                }
            }

            // 5. EK DOSYA YÜKLEME
            if (documentFile != null)
            {
                string pdfPath = _permissionHelpers.GetFilePath(documentFile);
                permission.DocumentPath = pdfPath;
            }

            // 6. KAYIT ATAMALARI
            permission.Status = "Pending";
            permission.IsAllowed = false;
            permission.CreatedAt = DateTime.Now;
            
            _permissionDal.Add(permission);

            // 7. BİLDİRİM
            var permissionUser = _userDal.Get(x => x.Id == permission.UserId);
            AddNotificationDto addNotificationDto = new()
            {
                Content = $"{permissionUser.Name} izin talebinde bulunmuştur.",
                Title = "İzin Başvurusu",
                Type = NotificationTypes.Permission.ToString()
            };
            _notificationService.SendAllByRoleName(addNotificationDto, "admin");

            return new SuccessResult(PermissionMessages.AddedPermission);
        }

        // 🔥 LOGLAMA EKLENDİ: İzin onaylandığında log düşer.
        [LoggerAspect]
        [SecuredOperation(RoleNames.Admin)]
        public IResult ConfirmPermission(int permissionId)
        {
            var permission = _permissionDal.Get(x => x.Id == permissionId);
            if (permission.Status == "Confirmed") return new ErrorResult("Bu izin zaten onaylanmış.");

            UserPermission userPermission = _userPermissionDal.GetUserPermissionByUserId(permission.UserId);
            
            if (permission != null && userPermission != null)
            {
                permission.IsAllowed = true;
                permission.Status = "Confirmed";

                if (!PermissionTypeHelper.IsExemptFromBalance(permission.PermissionTypeId))
                {
                    var ptRow = _permissionTypeDal.Get(x => x.Id == permission.PermissionTypeId);
                    bool isHourly = PermissionTypeHelper.IsHourly(permission.PermissionTypeId, ptRow?.SubPermission, ptRow?.DurationUnit);
                    double balanceUnits = UserPermissionCalculate.CalculateTotalWorkingDays(permission.StartTime, permission.EndTime, _holidayDal, permission.PermissionTypeId);
                    if (isHourly)
                        balanceUnits = (permission.EndTime - permission.StartTime).TotalHours;

                    userPermission.UsedLeave += balanceUnits;
                    permission.LeaveTakenFromBonus = 0;
                    userPermission.RemainingLeave -= balanceUnits;
                    _userPermissionDal.Update(userPermission);
                }

                _permissionDal.Update(permission);
                
                AddNotificationDto addNotificationDto = new()
                {
                    AssignedUserId = permission.UserId,
                    Content = "İzin talebiniz onaylanmıştır.",
                    Title = "İzin Onay",
                    Type = NotificationTypes.Permission.ToString()
                };
                _notificationService.Add(addNotificationDto);

                return new SuccessResult(PermissionMessages.ConfirmPermission);
            }
            return new ErrorResult(PermissionMessages.UserNotFound);
        }

        // 🔥 LOGLAMA EKLENDİ: İzin reddedildiğinde log düşer.
        [LoggerAspect]
        [SecuredOperation(RoleNames.Admin)]
        public IResult DeclinePermission(int permissionId, string reason)
        {
            var permission = _permissionDal.Get(x => x.Id == permissionId);
            UserPermission userPermission = _userPermissionDal.GetUserPermissionByUserId(permission.UserId);

            if (permission != null && userPermission != null)
            {
                if (permission.Status == "Confirmed")
                {
                    if (!PermissionTypeHelper.IsExemptFromBalance(permission.PermissionTypeId))
                    {
                        var ptRow = _permissionTypeDal.Get(x => x.Id == permission.PermissionTypeId);
                        bool isHourly = PermissionTypeHelper.IsHourly(permission.PermissionTypeId, ptRow?.SubPermission, ptRow?.DurationUnit);
                        double balanceUnits = UserPermissionCalculate.CalculateTotalWorkingDays(permission.StartTime, permission.EndTime, _holidayDal, permission.PermissionTypeId);
                        if (isHourly)
                            balanceUnits = (permission.EndTime - permission.StartTime).TotalHours;

                        userPermission.UsedLeave -= balanceUnits;

                        if (userPermission.UsedLeave < 0) userPermission.UsedLeave = 0;
                        userPermission.RemainingLeave += balanceUnits;
                        _userPermissionDal.Update(userPermission);
                    }
                }

                permission.IsAllowed = false;
                permission.Status = "Declined";
                permission.RejectReason = reason;

                _permissionDal.Update(permission);
                
                string notificationContent = string.IsNullOrEmpty(reason) ? "İzin talebiniz reddedildi." : $"İzin talebiniz reddedildi. Açıklama: {reason}";
                AddNotificationDto addNotificationDto = new()
                {
                    AssignedUserId = permission.UserId,
                    Content = notificationContent,
                    Title = "İzin Reddedildi",
                    Type = NotificationTypes.Permission.ToString()
                };
                _notificationService.Add(addNotificationDto);

                return new SuccessResult(PermissionMessages.DeclinePermission);
            }
            return new ErrorResult(PermissionMessages.UserNotFound);
        }

        // 🔥 LOGLAMA EKLENDİ: İzin güncellendiğinde log düşer.
        [LoggerAspect]
        // [SecuredOperation(RoleNames.Admin)] 
        public IResult Update(Permission permission, IFormFile? documentFile)
        {
            var permissionToUpdate = _permissionDal.Get(x => x.Id == permission.Id);
            if (permissionToUpdate == null) return new ErrorResult("Güncellenecek kayıt bulunamadı.");

            // SADECE TATİL/HAFTASONU ENGELİ
            double actualLeaveDays = UserPermissionCalculate.CalculateActualLeaveDays(permission.StartTime, permission.EndTime, _holidayDal);
            if (actualLeaveDays == 0)
            {
                return new ErrorResult("Sadece resmi tatil veya hafta sonu olan günlerde izin talep edilemez.");
            }

            var ptForUpdate = _permissionTypeDal.Get(x => x.Id == permission.PermissionTypeId);
            var durationCheckUpdate = ValidateRequestedDurationAgainstPermissionType(permission, ptForUpdate);
            if (!durationCheckUpdate.Success) return durationCheckUpdate;

            permissionToUpdate.PermissionTypeId = permission.PermissionTypeId;
            permissionToUpdate.StartTime = permission.StartTime;
            permissionToUpdate.EndTime = permission.EndTime;
            permissionToUpdate.PhoneNumber = permission.PhoneNumber;
            permissionToUpdate.Address = permission.Address;
            permissionToUpdate.Description = permission.Description;
            permissionToUpdate.Status = "Pending"; 
            permissionToUpdate.IsAllowed = false; 
            permissionToUpdate.RejectReason = null;

            if (documentFile != null)
            {
                string pdfPath = _permissionHelpers.GetFilePath(documentFile);
                permissionToUpdate.DocumentPath = pdfPath;
            }
            else if (permission.DocumentPath != null)
            {
                permissionToUpdate.DocumentPath = string.IsNullOrWhiteSpace(permission.DocumentPath)
                    ? null
                    : permission.DocumentPath;
            }

            _permissionDal.Update(permissionToUpdate);
            return new SuccessResult(PermissionMessages.UpdatedPermission);
        }

        // 🔥 LOGLAMA EKLENDİ: İzin silindiğinde log düşer.
        [LoggerAspect]
        public IResult Delete(Permission permission)
        {
            _permissionDal.Delete(permission);
            return new SuccessResult(PermissionMessages.DeletedPermission);
        }

        [LoggerAspect]
        public IResult CancelOwnPendingPermission(long userId, long permissionId)
        {
            var permission = _permissionDal.Get(x => x.Id == permissionId);
            if (permission == null) return new ErrorResult("Kayıt bulunamadı.");
            if (permission.UserId != userId) return new ErrorResult("Bu talebe işlem yapamazsınız.");
            if (permission.Status != "Pending") return new ErrorResult("Yalnızca onay bekleyen talepler iptal edilebilir.");
            return Delete(permission);
        }

        // --- OKUMA İŞLEMLERİ (Genelde Loglanmaz ama istersen ekleyebilirsin) ---

        [SecuredOperation(RoleNames.Admin)]
        public IDataResult<List<Permission>> GetAll()
        {
            return new SuccessDataResult<List<Permission>>(_permissionDal.GetAll());
        }

        [SecuredOperation(RoleNames.Admin)]
        public IDataResult<List<Permission>> GetByPermissionType(string permissionType)
        {
            return new SuccessDataResult<List<Permission>>(_permissionDal.GetByPermissionType(permissionType));
        }

        [SecuredOperation($"{RoleNames.Admin},{RoleNames.User},{RoleNames.Worker}")]
        public byte[] CreatePermissionPDF(int permissionId)
        {
            var permission = _permissionDal.Get(x => x.Id == permissionId);
            if (permission == null) throw new Exception("İzin kaydı bulunamadı.");

            var permissionTypeRow = _permissionTypeDal.Get(x => x.Id == permission.PermissionTypeId);
            permission.PermissionTypeRef = permissionTypeRow;

            var user = _userDal.Get(x => x.Id == permission.UserId);
            if (user == null) throw new Exception("İzin sahibi kullanıcı bulunamadı.");

            try
            {
                double totalAmount = UserPermissionCalculate.CalculateActualLeaveDays(permission.StartTime, permission.EndTime, _holidayDal);
                
                bool isHourlyCondition = PermissionTypeHelper.IsHourly(permission.PermissionTypeId, permission.PermissionTypeRef?.SubPermission, permission.PermissionTypeRef?.DurationUnit) || 
                                         (permission.StartTime.Date == permission.EndTime.Date && (permission.EndTime - permission.StartTime).TotalHours < 8);

                if (isHourlyCondition)
                {
                    TimeSpan diff = permission.EndTime - permission.StartTime;
                    totalAmount = diff.TotalHours;
                }

                // İşe giriş tarihi UserJobDetail.StartDate'ten okunuyor
                var jobDetail = _userJobDetailDal.Get(j => j.UserId == user.Id);
                DateTime jobStartDate = jobDetail?.StartDate ?? DateTime.MinValue;

                // --- SENARYO BAZLI BEYAN METNİ (PDF sağ bölümü için) ---
                // Ücretli izinlerde (IK001 ve IK003) her zaman kıdem + bakiye üzerinden
                // doğru senaryo hesaplanır; Description alanı (sol tablodaki gerekçe) değişmez.
                string leaveDeclaration = null;
                if (PermissionTypeHelper.IsUcretli(permission.PermissionTypeId))
                {
                    var userPermission = _userPermissionDal.GetUserPermissionByUserId(permission.UserId);
                    // Eğer izin onaylanmışsa bakiye düşülmüş olabilir; talep edilen gün kadar geri ekle
                    double remainingDays = userPermission?.RemainingLeave ?? 0;
                    if (permission.Status == "Confirmed" && permission.IsAdvanceLeave)
                        remainingDays += totalAmount; // onay öncesi bakiyeyi yeniden hesapla

                    leaveDeclaration = BuildLeaveDescription(permission, jobStartDate, remainingDays, totalAmount);
                }

                return _permissionPdfGenerator.GeneratePdf(permission, user, totalAmount, jobStartDate, leaveDeclaration);
            }
            catch (Exception ex)
            {
                throw new Exception($"PDF oluşturulurken hata oluştu: {ex.Message}");
            }
        }

        /// <summary>
        /// Kullanıcının kıdemine ve izin bakiyesine göre 3 senaryodan uygun dilekçe metnini döndürür.
        /// Senaryo 1 – 1 yılını doldurmamış (avans/advance).
        /// Senaryo 2 – Yeterli bakiye (standart).
        /// Senaryo 3 – Bakiye aşılıyor (mahsup beyanı).
        /// </summary>
        private static string BuildLeaveDescription(
            Permission p, DateTime jobStartDate, double remainingDays, double requestedDays)
        {
            bool hasJobStart   = jobStartDate != DateTime.MinValue;
            bool isUnderOneYear = hasJobStart && DateTime.Now < jobStartDate.AddYears(1);

            string startStr = p.StartTime.ToString("dd.MM.yyyy");
            string endStr   = p.EndTime.ToString("dd.MM.yyyy");

            // SENARYO 1: 1 Yılını Doldurmamış
            if (isUnderOneYear)
            {
                string hireStr = jobStartDate.ToString("dd.MM.yyyy");
                return
                    $"{hireStr} tarihinde başlamış olduğum görevimde henüz bir yıllık hizmet süremi " +
                    $"doldurmamış olmama rağmen, ileride hak edeceğim yıllık iznimden mahsup edilmek " +
                    $"üzere, yukarıda detayları belirtilen tarihler arasında yıllık izin kullanmak istiyorum.\n\n" +
                    $"Bir yıllık hizmet süremi tamamlamadan, kendi isteğimle veya isteğim dışında işten " +
                    $"ayrılmam durumunda, bu talebin ücretsiz izin kapsamında değerlendirileceğini ve " +
                    $"ilgili günlere ait ücretin tarafıma ödenmeyeceğini bildiğimi beyan eder, " +
                    $"gereğinin yapılmasını arz ederim.\n\nSaygılarımla.";
            }

            // SENARYO 3: Bakiye Aşılıyor
            if (requestedDays > remainingDays)
            {
                return
                    $"Yıllık ücretli izin kullanma dönemim kapsamında, {startStr} - {endStr} tarihleri " +
                    $"arasında toplam {requestedDays:0.##} gün izin kullanmak istiyorum.\n\n" +
                    $"Mevcut yıllık izin bakiyemin {remainingDays:0.##} gün olduğunu bilmekteyim. " +
                    $"Talep ettiğim izin süresinin mevcut bakiyemi aşan kısmının, ileride hak edeceğim " +
                    $"yıllık izinlerimden mahsup edilmesini kabul ediyorum.\n\n" +
                    $"Herhangi bir nedenle iş akdimin sona ermesi halinde, hak edilmemiş izin sürelerine " +
                    $"karşılık gelen tutarın tarafımdan tahsil edileceğini bildiğimi beyan eder, " +
                    $"gereğinin yapılmasını arz ederim.\n\nSaygılarımla.";
            }

            // SENARYO 2: Yeterli Bakiye (Standart)
            return
                $"Yıllık ücretli izin kullanma dönemim kapsamında, {startStr} - {endStr} tarihleri " +
                $"arasında kullanmak istediğim {requestedDays:0.##} gün yıllık izin talebimi " +
                $"bilgilerinize sunarım.\n\n" +
                $"Sahip olduğum yıllık izin hakkım çerçevesinde, belirtilen tarihlerde iznimin " +
                $"kullandırılması hususunda gereğini arz ederim.\n\nSaygılarımla.";
        }

        /// <summary>PermissionTypes.Min/MaxDuration ve DurationUnit kurallarına göre talep süresini doğrular.</summary>
        private IResult ValidateRequestedDurationAgainstPermissionType(Permission permission, PermissionTypes pt)
        {
            if (pt == null) return new SuccessResult();

            if ((PermissionDurationUnit)pt.DurationUnit == PermissionDurationUnit.Hour)
            {
                if (permission.StartTime.Date != permission.EndTime.Date)
                    return new ErrorResult("Saatlik izin aynı takvim günü içinde seçilmelidir.");
                double hours = (permission.EndTime - permission.StartTime).TotalHours;
                if (hours <= 0)
                    return new ErrorResult("Bitiş saati başlangıçtan sonra olmalıdır.");
                if (pt.MinDuration.HasValue && hours < (double)pt.MinDuration.Value - 1e-6)
                    return new ErrorResult($"Talep en az {pt.MinDuration.Value} saat olmalıdır.");
                if (pt.MaxDuration.HasValue && hours > (double)pt.MaxDuration.Value + 1e-6)
                    return new ErrorResult($"Talep en fazla {pt.MaxDuration.Value} saat olabilir.");
                return new SuccessResult();
            }

            // Ücretsiz izinde bakiyeden düşüm olmadığı için hesap fonksiyonu 0 döndürür;
            // bu durum doğrulama hatası olarak yorumlanmamalıdır.
            if (PermissionTypeHelper.IsUcretsiz(permission.PermissionTypeId))
                return new SuccessResult();

            double days = UserPermissionCalculate.CalculateTotalWorkingDays(permission.StartTime, permission.EndTime, _holidayDal, permission.PermissionTypeId);
            if (days <= 0)
                return new ErrorResult("Seçilen tarih aralığında geçerli izin süresi hesaplanamadı.");
            if (pt.MinDuration.HasValue && days < (double)pt.MinDuration.Value - 0.01)
                return new ErrorResult($"Talep en az {pt.MinDuration.Value} gün olmalıdır.");
            if (pt.MaxDuration.HasValue && days > (double)pt.MaxDuration.Value + 0.01)
                return new ErrorResult($"Talep en fazla {pt.MaxDuration.Value} gün olabilir.");
            return new SuccessResult();
        }

        [SecuredOperation(RoleNames.Admin)]
        public IDataResult<Permission> GetById(int permissionId)
        {
            var permission = _permissionDal.GetById(permissionId);
            return new SuccessDataResult<Permission>(permission);
        }

        public IDataResult<List<Permission>> GetPermissionByUserId(long userId)
        {
            return new SuccessDataResult<List<Permission>>(_permissionDal.GetPermissionByUserId(userId));
        }

        [SecuredOperation(RoleNames.Admin)]
        public IDataResult<List<AdminCalendarEventDto>> GetAdminCalendarEvents(DateTime start, DateTime end)
        {
            if (end < start) return new ErrorDataResult<List<AdminCalendarEventDto>>("Geçersiz tarih aralığı.");
            var endExclusive = end.Date.AddDays(1);
            var all = _permissionDal.GetAll();
            var typeMap = _permissionTypeDal.GetAll().ToDictionary(t => t.Id, t => t);
            var inRange = all
                .Where(p =>
                    p.Status == "Confirmed" &&
                    p.StartTime < endExclusive &&
                    p.EndTime > start.Date)
                .ToList();
            var list = new List<AdminCalendarEventDto>(inRange.Count);
            foreach (var p in inRange)
            {
                var user = _userDal.Get(u => u.Id == p.UserId);
                typeMap.TryGetValue(p.PermissionTypeId, out var pt);
                var name = pt != null
                    ? PermissionTypeHelper.GetPermissionTypeDisplayName(p.PermissionTypeId, pt.SubPermission)
                    : $"Tip #{p.PermissionTypeId}";
                list.Add(new AdminCalendarEventDto
                {
                    PermissionId = (int)p.Id,
                    UserId = p.UserId,
                    UserName = user?.Name?.Trim() ?? ($"Kullanıcı {p.UserId}"),
                    UserEmail = user?.Email,
                    PermissionTypeId = p.PermissionTypeId,
                    PermissionTypeName = name,
                    StartTime = p.StartTime,
                    EndTime = p.EndTime,
                    Status = p.Status
                });
            }
            return new SuccessDataResult<List<AdminCalendarEventDto>>(list.OrderBy(e => e.StartTime).ToList());
        }
    }
}