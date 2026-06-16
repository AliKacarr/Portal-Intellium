using AutoMapper;
using Business.BusinessAspects; // ✅ LoggerAspect için
using Business.Repository.HealthInfoRepository.Validation;
using Business.Repository.NotificationRepository;
using Business.Repository.UserRepository;
using Core.Aspects.Autofac.Validation;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Concrete.EntityFramework.Context;
using DataAccess.Repository.HealthInfoRepository;
using Entities.Concrete;
using Entities.DTOs.HealthInfoDtos;
using Entities.DTOs.NotificationDtos;
using Entities.Enums;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;

namespace Business.Repository.HealthInfoRepository
{
    public class HealthInfoManager : IHealthInfoService
    {
        private readonly IHealthInfoDal _healthInfoDal;
        private readonly IUserService _userService;
        private readonly IMapper _mapper;
        private readonly INotificationService _notificationService;
        private readonly IWebHostEnvironment _webHostEnvironment;

        public HealthInfoManager(IHealthInfoDal healthInfoDal, IMapper mapper, IUserService userService, INotificationService notificationService, IWebHostEnvironment webHostEnvironment)
        {
            _healthInfoDal = healthInfoDal;
            _mapper = mapper;
            _userService = userService;
            _notificationService = notificationService;
            _webHostEnvironment = webHostEnvironment;
        }

        private bool IsAdmin(ClaimsPrincipal user)
        {
            return user.IsInRole("admin");
        }

        // 🔥 LOGLAMA EKLENDİ: Sağlık bilgisi eklendiğinde log düşer.
        [LoggerAspect]
        [ValidationAspect(typeof(AddHealthInfoValidator))]
        public IResult Add(AddHealthInfoDto healthInfoAddDto, ClaimsPrincipal user)
        {
            if (!_userService.DoesUserExist(healthInfoAddDto.UserId).Success)
                return new ErrorResult("Kullanıcı bulunamadı.");

            if (healthInfoAddDto.PremiumDetails != null && !IsAdmin(user))
            {
                return new ErrorResult("Sadece Admin yetkisine sahip kullanıcılar prim bilgisi ekleyebilir.");
            }

            HealthInfo entity;
            try { entity = _mapper.Map<HealthInfo>(healthInfoAddDto); }
            catch (Exception ex) {
                return new ErrorResult($"Veri eşleştirilirken hata (AutoMapper): {ex.Message}");
            }

            List<string> savedFileNames = new List<string>();
            if (healthInfoAddDto.Files != null && healthInfoAddDto.Files.Count > 0) {
                try {
                    foreach (var file in healthInfoAddDto.Files)
                    {
                        var savedName = SaveFile(file);
                        savedFileNames.Add(savedName);
                        entity.HealthInfoDocuments.Add(new HealthInfoDocument
                        {
                            FilePath = savedName,
                            DocumentType = "Poliçe",
                            UploadedAt = DateTime.UtcNow
                        });
                    }
                } catch (Exception ex) {
                    foreach(var fileName in savedFileNames) { TryDeleteFile(fileName); }
                    return new ErrorResult($"Dosya kaydedilirken hata: {ex.Message}");
                }
            }
            
            entity.AddedAt = DateTime.UtcNow;
            entity.IsActive = true;

            try {
                _healthInfoDal.Add(entity); 
            } catch (Exception dbEx) {
                foreach(var fileName in savedFileNames) { TryDeleteFile(fileName); }
                return new ErrorResult($"Veritabanına eklenirken hata: {dbEx.InnerException?.Message ?? dbEx.Message}");
            }

            // --- 🔥 BİLDİRİM KISMI 🔥 ---
            // Bildirim hatası ana işlemi etkilemesin diye ayrı try-catch içinde
            try {
                _notificationService.Add(new AddNotificationDto
                {
                    AssignedUserId = entity.UserId,
                    Title = "Yeni Sağlık Bilgisi",
                    Content = "Hesabınıza yeni bir sağlık/sigorta bilgisi eklendi.",
                    Type = "health",
                    ReferenceId = entity.Id.ToString()
                });
            } catch (Exception notifEx) {
                Console.WriteLine($"[WARN] Bildirim eklenirken hata (kayıt yine de eklendi): {notifEx.Message}");
            }
            // ---------------------------------------------

            return new SuccessResult("Sağlık bilgisi başarıyla eklendi.");
        }

        // 🔥 LOGLAMA EKLENDİ: Sağlık bilgisi silindiğinde log düşer.
        [LoggerAspect]
        public IResult Delete(long id)
        {
            using var context = new PortalContext();

            var entityToDelete = context.HealthInfos
                .Include(hi => hi.HealthInfoDocuments) 
                .Include(hi => hi.HealthInfoDependents) 
                .Include(hi => hi.HealthInfoPremium) 
                .FirstOrDefault(h => h.Id == id);
                
            if (entityToDelete == null) return new ErrorResult("Sağlık bilgisi bulunamadı.");

            var filesToDelete = entityToDelete.HealthInfoDocuments
                                    .Select(doc => doc.FilePath)
                                    .ToList();

            try {
                 context.HealthInfoDocuments.RemoveRange(entityToDelete.HealthInfoDocuments);
                 context.HealthInfoDependents.RemoveRange(entityToDelete.HealthInfoDependents);
                 if(entityToDelete.HealthInfoPremium != null)
                     context.HealthInfoPremiums.Remove(entityToDelete.HealthInfoPremium);
                 
                 context.HealthInfos.Remove(entityToDelete);
                 
                 context.SaveChanges(); 

                 foreach (var fileName in filesToDelete)
                 {
                    TryDeleteFile(fileName);
                 }
                 
                 return new SuccessResult("Sağlık bilgisi ve ilişkili tüm kayıtlar başarıyla silindi.");
            } catch(Exception dbEx) {
                 return new ErrorResult($"Veritabanından silinirken hata: {dbEx.InnerException?.Message ?? dbEx.Message}");
            }
        }

        // 🔥 LOGLAMA EKLENDİ: Sağlık bilgisi güncellendiğinde log düşer.
        [LoggerAspect]
        [ValidationAspect(typeof(UpdateHealthInfoValidator))]
        public IResult Update(UpdateHealthInfoDto healthInfoUpdateDto, ClaimsPrincipal user)
        {
            using var context = new PortalContext();

            var existingEntity = context.HealthInfos
                .Include(hi => hi.HealthInfoPremium)
                .Include(hi => hi.HealthInfoDependents)
                .Include(hi => hi.HealthInfoDocuments)
                .FirstOrDefault(h => h.Id == healthInfoUpdateDto.Id);

            if (existingEntity == null) return new ErrorResult("Güncellenecek sağlık bilgisi bulunamadı.");
            if (!_userService.DoesUserExist(healthInfoUpdateDto.UserId).Success) return new ErrorResult("Kullanıcı bulunamadı.");

            if (healthInfoUpdateDto.PremiumDetails != null && !IsAdmin(user))
            {
                return new ErrorResult("Sadece Admin yetkisine sahip kullanıcılar prim bilgisini güncelleyebilir.");
            }
            
            List<string> newSavedFileNames = new List<string>();
            List<string> filesToDeleteDbSuccess = new List<string>();

            try
            {
                _mapper.Map(healthInfoUpdateDto, existingEntity);
                
                // --- Bağımlıları Yönet ---
                if (healthInfoUpdateDto.DeletedDependentIds != null)
                {
                    var dependentsToDelete = existingEntity.HealthInfoDependents
                        .Where(d => healthInfoUpdateDto.DeletedDependentIds.Contains(d.Id))
                        .ToList();
                    context.HealthInfoDependents.RemoveRange(dependentsToDelete);
                }
                
                foreach (var dependentDto in healthInfoUpdateDto.Dependents)
                {
                    if (dependentDto.Id > 0)
                    {
                        var existingDependent = existingEntity.HealthInfoDependents.FirstOrDefault(d => d.Id == dependentDto.Id);
                        if (existingDependent != null) _mapper.Map(dependentDto, existingDependent); 
                    }
                    else
                    {
                        var newDependent = _mapper.Map<HealthInfoDependent>(dependentDto);
                        existingEntity.HealthInfoDependents.Add(newDependent); 
                    }
                }

                // --- Dokümanları Yönet ---
                if (healthInfoUpdateDto.DeletedDocumentIds != null)
                {
                    var documentsToDelete = existingEntity.HealthInfoDocuments
                        .Where(d => healthInfoUpdateDto.DeletedDocumentIds.Contains(d.Id))
                        .ToList();
                    
                    foreach (var doc in documentsToDelete)
                    {
                        filesToDeleteDbSuccess.Add(doc.FilePath);
                        context.HealthInfoDocuments.Remove(doc);
                    }
                }
                
                if (healthInfoUpdateDto.Files != null && healthInfoUpdateDto.Files.Count > 0)
                {
                    foreach (var file in healthInfoUpdateDto.Files)
                    {
                        var savedName = SaveFile(file); 
                        newSavedFileNames.Add(savedName);
                        
                        existingEntity.HealthInfoDocuments.Add(new HealthInfoDocument
                        {
                            FilePath = savedName,
                            DocumentType = "Poliçe",
                            UploadedAt = DateTime.UtcNow
                        });
                    }
                }

                context.SaveChanges(); 

                // --- 🔥 BİLDİRİM KISMI 🔥 ---
                // Bildirim hatası ana işlemi etkilemesin diye ayrı try-catch içinde
                try {
                    _notificationService.Add(new AddNotificationDto
                    {
                        AssignedUserId = existingEntity.UserId,
                        Title = "Sağlık Bilgisi Güncellendi",
                        Content = "Sağlık/Sigorta bilgilerinizde değişiklik yapıldı.",
                        Type = "health",
                        ReferenceId = existingEntity.Id.ToString()
                    });
                } catch (Exception notifEx) {
                    Console.WriteLine($"[WARN] Bildirim eklenirken hata (kayıt yine de güncellendi): {notifEx.Message}");
                }
                // ---------------------------------------------
                
                foreach (var filePath in filesToDeleteDbSuccess)
                {
                    TryDeleteFile(filePath);
                }

                return new SuccessResult("Sağlık bilgisi başarıyla güncellendi.");
            }
            catch(Exception dbEx)
            {
                 foreach (var fileName in newSavedFileNames) { TryDeleteFile(fileName); }
                 return new ErrorResult($"Veritabanı güncellenirken hata: {dbEx.InnerException?.Message ?? dbEx.Message}");
            }
        }

        // --- Get Metodları ---
        public IDataResult<List<GetHealthInfoWithUserDto>> GetAllWithUser(ClaimsPrincipal user)
        {
             try {
                 var result = _healthInfoDal.GetAllWithUser();
                 if (!IsAdmin(user))
                 {
                     foreach (var item in result) { item.PremiumDetails = null; }
                 }
                 return new SuccessDataResult<List<GetHealthInfoWithUserDto>>(result);
             } catch (Exception ex) {
                 return new ErrorDataResult<List<GetHealthInfoWithUserDto>>($"Veriler alınırken hata: {ex.Message}");
             }
        }

        public IDataResult<GetHealthInfoWithUserDto> GetWithUserById(long id, ClaimsPrincipal user)
        {
             try {
                var result = _healthInfoDal.GetWithUserById(id);
                if (result == null) return new ErrorDataResult<GetHealthInfoWithUserDto>("Sağlık bilgisi bulunamadı.");

                if (!IsAdmin(user))
                {
                    result.PremiumDetails = null;
                }
                
                return new SuccessDataResult<GetHealthInfoWithUserDto>(result);
             } catch (Exception ex) {
                 return new ErrorDataResult<GetHealthInfoWithUserDto>($"Veri alınırken hata: {ex.Message}");
             }
        }

        public IDataResult<List<HealthInfo>> GetAllByUserId(long userId)
        {
            try {
                var result = _healthInfoDal.GetAll(h => h.UserId == userId);
                return new SuccessDataResult<List<HealthInfo>>(result);
             } catch (Exception ex) {
                 return new ErrorDataResult<List<HealthInfo>>($"Veriler alınırken hata: {ex.Message}");
             }
        }

        // --- YARDIMCI METODLAR ---
        private string SaveFile(Microsoft.AspNetCore.Http.IFormFile file)
        {
            string folderPath = GetUploadFolderPath(); 
            string uniqueFileName = Guid.NewGuid().ToString() + "_" + Path.GetFileName(file.FileName);
            string filePath = Path.Combine(folderPath, uniqueFileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create)) {
                file.CopyTo(fileStream);
            }
            return uniqueFileName; 
        }

        private void TryDeleteFile(string? fileName)
        {
            if (string.IsNullOrEmpty(fileName)) return;
            try {
                string folderPath = GetUploadFolderPath();
                string fullFilePath = Path.Combine(folderPath, fileName);
                
                if (System.IO.File.Exists(fullFilePath)) {
                    System.IO.File.Delete(fullFilePath);
                }
            } catch (Exception ex) {
                Console.WriteLine($"[WARN] Dosya silinirken hata ({fileName}): {ex.Message}");
            }
        }

        private string GetUploadFolderPath()
        {
            string wwwRootPath = _webHostEnvironment.WebRootPath;
            if (string.IsNullOrEmpty(wwwRootPath)) {
                 wwwRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                 if (!Directory.Exists(wwwRootPath))
                     throw new Exception("wwwroot path bulunamadı.");
            }
            
            string folderPath = Path.Combine(wwwRootPath, "uploads", "healthinfodocuments"); 
            Directory.CreateDirectory(folderPath);
            return folderPath;
        }
    }
}