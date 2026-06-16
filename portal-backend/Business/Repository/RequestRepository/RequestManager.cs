using Business.BusinessAspects;
using Business.File;
using Core.Aspects.Autofac.Validation;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using Business.Helpers;
using Business.Repository.MailRepository;
using Business.Repository.NotificationRepository;
using Business.Repository.UserRepository;
using DataAccess.Repository.RequestRepository;
using DataAccess.Repository.UserRepository;
using Entities.Concrete;
using Entities.Constants;
using Entities.DTOs.RequestDtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using System.IO;
using Business.Repository.RequestRepository.Validations;
using IResult = Core.Utilities.Results.Abstract.IResult;

namespace Business.Repository.RequestRepository
{
    public class RequestManager : IRequestService
    {
        private readonly IRequestCategoryDal _categoryDal;
        private readonly IRequestSubCategoryDal _subCategoryDal;
        private readonly IRequestSubCategoryFieldDal _subCategoryFieldDal;
        private readonly IRequestDal _requestDal;
        private readonly IRequestStatusHistoryDal _historyDal;
        private readonly IRequestAttachmentDal _attachmentDal;
        private readonly IFileService _fileService;
        private readonly IUserContext _userContext;
        private readonly INotificationService _notificationService;
        private readonly IUserService _userService;
        private readonly IMailService _mailService;
        private readonly ISmtpMailParametersProvider _smtpMailParametersProvider;
        private readonly IUserDal _userDal;

        public RequestManager(
            IRequestCategoryDal categoryDal,
            IRequestSubCategoryDal subCategoryDal,
            IRequestSubCategoryFieldDal subCategoryFieldDal,
            IRequestDal requestDal,
            IRequestStatusHistoryDal historyDal,
            IRequestAttachmentDal attachmentDal,
            IFileService fileService,
            IUserContext userContext,
            INotificationService notificationService,
            IUserService userService,
            IMailService mailService,
            ISmtpMailParametersProvider smtpMailParametersProvider,
            IUserDal userDal)
        {
            _categoryDal = categoryDal;
            _subCategoryDal = subCategoryDal;
            _subCategoryFieldDal = subCategoryFieldDal;
            _requestDal = requestDal;
            _historyDal = historyDal;
            _attachmentDal = attachmentDal;
            _fileService = fileService;
            _userContext = userContext;
            _notificationService = notificationService;
            _userService = userService;
            _mailService = mailService;
            _smtpMailParametersProvider = smtpMailParametersProvider;
            _userDal = userDal;
        }

        public IDataResult<List<RequestCategoryDto>> GetCategories()
        {
            var cats = _categoryDal.GetAll(x => x.IsActive).OrderBy(x => x.SortOrder).ThenBy(x => x.Id).ToList();
            var subs = _subCategoryDal.GetAll(x => x.IsActive).OrderBy(x => x.SortOrder).ThenBy(x => x.Id).ToList();
            var fields = _subCategoryFieldDal.GetAll(x => x.IsActive).OrderBy(x => x.SortOrder).ThenBy(x => x.Id).ToList();

            var byCat = subs.GroupBy(x => x.CategoryId).ToDictionary(g => g.Key, g => g.ToList());
            var fieldsBySub = fields.GroupBy(x => x.SubCategoryId).ToDictionary(g => g.Key, g => g.ToList());
            var dto = cats.Select(c => new RequestCategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                SortOrder = c.SortOrder,
                SubCategories = (byCat.TryGetValue(c.Id, out var list) ? list : new List<RequestSubCategory>())
                    .Select(s => new RequestSubCategoryDto
                    {
                        Id = s.Id,
                        Name = s.Name,
                        IsOther = s.IsOther,
                        SortOrder = s.SortOrder,
                        Fields = (fieldsBySub.TryGetValue(s.Id, out var fieldList) ? fieldList : new List<RequestSubCategoryField>())
                            .Select(MapFieldDto)
                            .ToList()
                    })
                    .ToList()
            }).ToList();

            return new SuccessDataResult<List<RequestCategoryDto>>(dto);
        }

        [SecuredOperation(RoleNames.Admin)]
        public IDataResult<RequestCategoryDto> AddCategory(UpsertRequestCategoryDto dto)
        {
            dto ??= new UpsertRequestCategoryDto();
            var name = (dto.Name ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(name))
                return new ErrorDataResult<RequestCategoryDto>("Kategori adı zorunludur.");

            var duplicate = _categoryDal.Get(x => x.IsActive && x.Name.ToLower() == name.ToLower());
            if (duplicate != null)
                return new ErrorDataResult<RequestCategoryDto>("Bu kategori adı zaten kullanılıyor.");

            var entity = new RequestCategory
            {
                Name = name,
                SortOrder = dto.SortOrder,
                IsActive = dto.IsActive
            };
            _categoryDal.Add(entity);
            return new SuccessDataResult<RequestCategoryDto>(MapCategoryDto(entity), "Kategori eklendi.");
        }

        [SecuredOperation(RoleNames.Admin)]
        public IDataResult<RequestCategoryDto> UpdateCategory(int id, UpsertRequestCategoryDto dto)
        {
            dto ??= new UpsertRequestCategoryDto();
            var entity = _categoryDal.Get(x => x.Id == id);
            if (entity == null)
                return new ErrorDataResult<RequestCategoryDto>("Kategori bulunamadı.");

            var name = (dto.Name ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(name))
                return new ErrorDataResult<RequestCategoryDto>("Kategori adı zorunludur.");

            var duplicate = _categoryDal.Get(x => x.Id != id && x.IsActive && x.Name.ToLower() == name.ToLower());
            if (duplicate != null)
                return new ErrorDataResult<RequestCategoryDto>("Bu kategori adı zaten kullanılıyor.");

            entity.Name = name;
            entity.SortOrder = dto.SortOrder;
            entity.IsActive = dto.IsActive;
            _categoryDal.Update(entity);
            return new SuccessDataResult<RequestCategoryDto>(MapCategoryDto(entity), "Kategori güncellendi.");
        }

        [SecuredOperation(RoleNames.Admin)]
        public IResult DeleteCategory(int id)
        {
            var entity = _categoryDal.Get(x => x.Id == id);
            if (entity == null)
                return new ErrorResult("Kategori bulunamadı.");

            entity.IsActive = false;
            _categoryDal.Update(entity);
            return new SuccessResult("Kategori pasifleştirildi.");
        }

        [SecuredOperation(RoleNames.Admin)]
        public IDataResult<RequestSubCategoryDto> AddSubCategory(UpsertRequestSubCategoryDto dto)
        {
            dto ??= new UpsertRequestSubCategoryDto();
            var category = _categoryDal.Get(x => x.Id == dto.CategoryId && x.IsActive);
            if (category == null)
                return new ErrorDataResult<RequestSubCategoryDto>("Kategori bulunamadı.");

            var name = (dto.Name ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(name))
                return new ErrorDataResult<RequestSubCategoryDto>("Alt kategori adı zorunludur.");

            var entity = new RequestSubCategory
            {
                CategoryId = dto.CategoryId,
                Name = name,
                IsOther = dto.IsOther,
                SortOrder = dto.SortOrder,
                IsActive = dto.IsActive
            };
            _subCategoryDal.Add(entity);
            return new SuccessDataResult<RequestSubCategoryDto>(MapSubCategoryDto(entity), "Alt kategori eklendi.");
        }

        [SecuredOperation(RoleNames.Admin)]
        public IDataResult<RequestSubCategoryDto> UpdateSubCategory(int id, UpsertRequestSubCategoryDto dto)
        {
            dto ??= new UpsertRequestSubCategoryDto();
            var entity = _subCategoryDal.Get(x => x.Id == id);
            if (entity == null)
                return new ErrorDataResult<RequestSubCategoryDto>("Alt kategori bulunamadı.");

            var category = _categoryDal.Get(x => x.Id == dto.CategoryId && x.IsActive);
            if (category == null)
                return new ErrorDataResult<RequestSubCategoryDto>("Kategori bulunamadı.");

            var name = (dto.Name ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(name))
                return new ErrorDataResult<RequestSubCategoryDto>("Alt kategori adı zorunludur.");

            entity.CategoryId = dto.CategoryId;
            entity.Name = name;
            entity.IsOther = dto.IsOther;
            entity.SortOrder = dto.SortOrder;
            entity.IsActive = dto.IsActive;
            _subCategoryDal.Update(entity);
            return new SuccessDataResult<RequestSubCategoryDto>(MapSubCategoryDto(entity), "Alt kategori güncellendi.");
        }

        [SecuredOperation(RoleNames.Admin)]
        public IResult DeleteSubCategory(int id)
        {
            var entity = _subCategoryDal.Get(x => x.Id == id);
            if (entity == null)
                return new ErrorResult("Alt kategori bulunamadı.");

            entity.IsActive = false;
            _subCategoryDal.Update(entity);
            return new SuccessResult("Alt kategori pasifleştirildi.");
        }

        [SecuredOperation(RoleNames.Admin)]
        public IDataResult<RequestSubCategoryFieldDto> AddSubCategoryField(UpsertRequestSubCategoryFieldDto dto)
        {
            var validate = ValidateFieldDto(dto, out var normalized);
            if (!validate.Success)
                return new ErrorDataResult<RequestSubCategoryFieldDto>(validate.Message);

            var existing = _subCategoryFieldDal.Get(x => x.SubCategoryId == normalized.SubCategoryId && x.FieldKey == normalized.FieldKey);
            if (existing != null)
                return new ErrorDataResult<RequestSubCategoryFieldDto>("Bu alt kategori için aynı alan anahtarı zaten var.");

            var entity = new RequestSubCategoryField
            {
                SubCategoryId = normalized.SubCategoryId,
                FieldKey = normalized.FieldKey,
                Label = normalized.Label,
                DataType = normalized.DataType,
                IsRequired = normalized.IsRequired,
                SortOrder = normalized.SortOrder,
                IsActive = normalized.IsActive
            };
            _subCategoryFieldDal.Add(entity);
            return new SuccessDataResult<RequestSubCategoryFieldDto>(MapFieldDto(entity), "Dinamik alan eklendi.");
        }

        [SecuredOperation(RoleNames.Admin)]
        public IDataResult<RequestSubCategoryFieldDto> UpdateSubCategoryField(int id, UpsertRequestSubCategoryFieldDto dto)
        {
            var entity = _subCategoryFieldDal.Get(x => x.Id == id);
            if (entity == null)
                return new ErrorDataResult<RequestSubCategoryFieldDto>("Dinamik alan bulunamadı.");

            var validate = ValidateFieldDto(dto, out var normalized);
            if (!validate.Success)
                return new ErrorDataResult<RequestSubCategoryFieldDto>(validate.Message);

            var duplicate = _subCategoryFieldDal.Get(x =>
                x.Id != id &&
                x.SubCategoryId == normalized.SubCategoryId &&
                x.FieldKey == normalized.FieldKey);
            if (duplicate != null)
                return new ErrorDataResult<RequestSubCategoryFieldDto>("Bu alt kategori için aynı alan anahtarı zaten var.");

            entity.SubCategoryId = normalized.SubCategoryId;
            entity.FieldKey = normalized.FieldKey;
            entity.Label = normalized.Label;
            entity.DataType = normalized.DataType;
            entity.IsRequired = normalized.IsRequired;
            entity.SortOrder = normalized.SortOrder;
            entity.IsActive = normalized.IsActive;
            _subCategoryFieldDal.Update(entity);
            return new SuccessDataResult<RequestSubCategoryFieldDto>(MapFieldDto(entity), "Dinamik alan güncellendi.");
        }

        [SecuredOperation(RoleNames.Admin)]
        public IResult DeleteSubCategoryField(int id)
        {
            var entity = _subCategoryFieldDal.Get(x => x.Id == id);
            if (entity == null)
                return new ErrorResult("Dinamik alan bulunamadı.");

            entity.IsActive = false;
            _subCategoryFieldDal.Update(entity);
            return new SuccessResult("Dinamik alan pasifleştirildi.");
        }

        [ValidationAspect(typeof(CreateRequestDtoValidator))]
        public IDataResult<RequestListItemDto> Create(CreateRequestDto dto)
        {
            if (!_userContext.IsAuthenticated)
                return new ErrorDataResult<RequestListItemDto>("Yetkilendirme gerekli.");

            dto ??= new CreateRequestDto();
            // Taslak kayıtta tüm alanlar zorunlu değil; sadece gönderimde zorunluluklar devreye girer.
            RequestCategory? category = null;
            RequestSubCategory? sub = null;
            if (!dto.SaveAsDraft)
            {
                if (dto.CategoryId <= 0)
                    return new ErrorDataResult<RequestListItemDto>("Kategori seçilmelidir.");
                if (dto.SubCategoryId <= 0)
                    return new ErrorDataResult<RequestListItemDto>("Alt kategori seçilmelidir.");

                category = _categoryDal.Get(x => x.Id == dto.CategoryId && x.IsActive);
                if (category == null)
                    return new ErrorDataResult<RequestListItemDto>("Kategori bulunamadı.");

                sub = _subCategoryDal.Get(x => x.Id == dto.SubCategoryId && x.CategoryId == dto.CategoryId && x.IsActive);
                if (sub == null)
                    return new ErrorDataResult<RequestListItemDto>("Alt kategori bulunamadı.");

            }
            else
            {
                // Taslak dönüşünde isim gösterebilmek için opsiyonel resolve
                category = dto.CategoryId > 0 ? _categoryDal.Get(x => x.Id == dto.CategoryId) : null;
                sub = dto.SubCategoryId > 0 ? _subCategoryDal.Get(x => x.Id == dto.SubCategoryId) : null;
            }

            var payloadJson = NormalizeJson(dto.PayloadJson);
            if (!dto.SaveAsDraft)
            {
                var dynamicValidation = ValidateRequiredDynamicFields(dto.SubCategoryId, payloadJson);
                if (!dynamicValidation.Success)
                    return new ErrorDataResult<RequestListItemDto>(dynamicValidation.Message);
            }

            var now = DateTime.UtcNow;
            var status = dto.SaveAsDraft ? TalepDurumu.Taslak : TalepDurumu.Gonderildi;

            var entity = new Request
            {
                UserId = _userContext.UserId,
                CategoryId = dto.CategoryId,
                SubCategoryId = dto.SubCategoryId,
                OtherText = string.IsNullOrWhiteSpace(dto.OtherText) ? null : dto.OtherText.Trim(),
                // Başlık kaldırıldı; DB uyumluluğu için boş string saklanır.
                Title = string.Empty,
                Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim(),
                PayloadJson = payloadJson,
                Status = status,
                CreatedAt = now,
                UpdatedAt = now,
                LastActionByUserId = _userContext.UserId,
                LastActionNote = dto.SaveAsDraft ? "Taslak kaydedildi." : "Talep gönderildi."
            };

            _requestDal.Add(entity);

            _historyDal.Add(new RequestStatusHistory
            {
                RequestId = entity.Id,
                FromStatus = string.Empty,
                ToStatus = TalepDurumuTurkish.ToTurkish(status),
                ActionByUserId = _userContext.UserId,
                Note = entity.LastActionNote,
                CreatedAt = now
            });

            // Talep gönderildiyse admin'e bildirim (taslakta bildirim yok)
            if (!dto.SaveAsDraft)
            {
                TryNotifyAdminsForNewRequest(entity, category, sub);
            }

            return new SuccessDataResult<RequestListItemDto>(MapListItem(entity, category, sub, ResolveOwnerName(entity.UserId)), "Kaydedildi.");
        }

        public IDataResult<List<RequestListItemDto>> GetMyRequests(string? status = null)
        {
            if (!_userContext.IsAuthenticated)
                return new ErrorDataResult<List<RequestListItemDto>>("Yetkilendirme gerekli.");

            var cats = _categoryDal.GetAll(x => x.IsActive).ToDictionary(x => x.Id, x => x);
            var subs = _subCategoryDal.GetAll(x => x.IsActive).ToDictionary(x => x.Id, x => x);

            var list = _requestDal.GetAll(x => x.UserId == _userContext.UserId);
            if (!string.IsNullOrWhiteSpace(status))
            {
                var wanted = status.Trim();
                if (!TalepDurumuTurkish.TryParseTurkish(wanted, out var wantedEnum))
                    list = new List<Request>();
                else
                    list = list.Where(x => x.Status == wantedEnum).ToList();
            }

            var ownerLabel = ResolveOwnerName(_userContext.UserId);
            var dto = list
                .OrderByDescending(x => x.UpdatedAt)
                .Select(x =>
                {
                    cats.TryGetValue(x.CategoryId, out var c);
                    RequestSubCategory? s = null;
                    subs.TryGetValue(x.SubCategoryId, out s);
                    return MapListItem(x, c, s, ownerLabel);
                })
                .ToList();

            return new SuccessDataResult<List<RequestListItemDto>>(dto);
        }

        [SecuredOperation(RoleNames.Admin)]
        public IDataResult<List<RequestListItemDto>> GetInbox(string? status = null, int? categoryId = null)
        {
            var cats = _categoryDal.GetAll(x => x.IsActive).ToDictionary(x => x.Id, x => x);
            var subs = _subCategoryDal.GetAll(x => x.IsActive).ToDictionary(x => x.Id, x => x);

            var list = _requestDal.GetAll();
            if (!string.IsNullOrWhiteSpace(status))
            {
                var wanted = status.Trim();
                if (!TalepDurumuTurkish.TryParseTurkish(wanted, out var wantedEnum))
                    list = new List<Request>();
                else
                    list = list.Where(x => x.Status == wantedEnum).ToList();
            }
            if (categoryId.HasValue && categoryId.Value > 0)
            {
                list = list.Where(x => x.CategoryId == categoryId.Value).ToList();
            }

            // Taslaklar yalnızca kullanıcı ekranında; admin gelen kutusunda gösterilmez
            list = list.Where(x => x.Status != TalepDurumu.Taslak).ToList();

            var ownerByUserId = BuildOwnerLabels(list.Select(x => x.UserId));

            var dto = list
                .OrderByDescending(x => x.UpdatedAt)
                .Select(x =>
                {
                    cats.TryGetValue(x.CategoryId, out var c);
                    RequestSubCategory? s = null;
                    subs.TryGetValue(x.SubCategoryId, out s);
                    var label = ownerByUserId.TryGetValue(x.UserId, out var on) ? on : FormatOwnerLabel(null, x.UserId);
                    return MapListItem(x, c, s, label, forAdminInbox: true);
                })
                .ToList();

            return new SuccessDataResult<List<RequestListItemDto>>(dto);
        }

        [SecuredOperation(RoleNames.Admin)]
        public IDataResult<RequestListItemDto> UpdateStatus(long id, UpdateRequestStatusDto dto)
        {
            if (!_userContext.IsAuthenticated)
                return new ErrorDataResult<RequestListItemDto>("Yetkilendirme gerekli.");

            if (id <= 0)
                return new ErrorDataResult<RequestListItemDto>("Geçersiz id.");
            dto ??= new UpdateRequestStatusDto();
            if (string.IsNullOrWhiteSpace(dto.Status))
                return new ErrorDataResult<RequestListItemDto>("Durum zorunludur.");

            if (!TalepDurumuTurkish.TryParseTurkish(dto.Status, out var target))
                return new ErrorDataResult<RequestListItemDto>("Geçersiz durum değeri.");

            var entity = _requestDal.Get(x => x.Id == id);
            if (entity == null)
                return new ErrorDataResult<RequestListItemDto>("Talep bulunamadı.");

            if (entity.Status == TalepDurumu.Taslak)
                return new ErrorDataResult<RequestListItemDto>("Taslak talepler bu akışla güncellenemez.");

            // İstek: Reddedildi / Tamamlandı durumlarında da admin tekrar güncelleyebilsin.
            // Sadece kullanıcı iptali (İptal Edildi) son durum olarak kalsın.
            if (entity.Status == TalepDurumu.IptalEdildi)
                return new ErrorDataResult<RequestListItemDto>("İptal edilen talebin durumu değiştirilemez.");

            if (target == TalepDurumu.Taslak || target == TalepDurumu.IptalEdildi)
                return new ErrorDataResult<RequestListItemDto>("Bu hedef durum seçilemez (iptal kullanıcı tarafından yapılır).");

            var allowedTargets = new[]
            {
                TalepDurumu.Gonderildi,
                TalepDurumu.Incelemede,
                TalepDurumu.EkBilgiBekleniyor,
                TalepDurumu.OnayBekliyor,
                TalepDurumu.IslemeAlindi,
                TalepDurumu.Tamamlandi,
                TalepDurumu.Reddedildi
            };
            if (!allowedTargets.Contains(target))
                return new ErrorDataResult<RequestListItemDto>("Geçersiz hedef durum.");

            if ((target == TalepDurumu.Reddedildi || target == TalepDurumu.EkBilgiBekleniyor)
                && string.IsNullOrWhiteSpace(dto.Note))
                return new ErrorDataResult<RequestListItemDto>("Bu durum için açıklama/not zorunludur.");

            var from = entity.Status;
            var now = DateTime.UtcNow;
            var noteTrim = string.IsNullOrWhiteSpace(dto.Note) ? null : dto.Note.Trim();

            entity.Status = target;
            entity.AdminHighlightUserResubmit = false;
            entity.UpdatedAt = now;
            entity.AssignedToUserId = dto.AssignedToUserId ?? entity.AssignedToUserId;
            entity.LastActionByUserId = _userContext.UserId;
            entity.LastActionNote = noteTrim;
            _requestDal.Update(entity);

            var fromTr = TalepDurumuTurkish.ToTurkish(from);
            var toTr = TalepDurumuTurkish.ToTurkish(target);
            if (from != target || !string.IsNullOrWhiteSpace(noteTrim))
            {
                _historyDal.Add(new RequestStatusHistory
                {
                    RequestId = entity.Id,
                    FromStatus = fromTr,
                    ToStatus = toTr,
                    ActionByUserId = _userContext.UserId,
                    Note = noteTrim,
                    CreatedAt = now
                });
            }

            var category = _categoryDal.Get(x => x.Id == entity.CategoryId);
            RequestSubCategory? sub = null;
            sub = _subCategoryDal.Get(x => x.Id == entity.SubCategoryId);

            if (from != target)
                TryNotifyOwnerForStatusChange(entity, from, target, category, sub, entity.LastActionNote);

            return new SuccessDataResult<RequestListItemDto>(MapListItem(entity, category, sub, ResolveOwnerName(entity.UserId)), "Güncellendi.");
        }

        public IDataResult<RequestDetailDto> GetMyRequestDetail(long id)
        {
            if (!_userContext.IsAuthenticated)
                return new ErrorDataResult<RequestDetailDto>("Yetkilendirme gerekli.");

            var isAdmin = string.Equals(_userContext.RoleName, RoleNames.Admin, StringComparison.OrdinalIgnoreCase);
            var entity = _requestDal.Get(x => x.Id == id && (isAdmin || x.UserId == _userContext.UserId));
            if (entity == null)
                return new ErrorDataResult<RequestDetailDto>("Talep bulunamadı.");

            var category = _categoryDal.Get(x => x.Id == entity.CategoryId);
            var sub = _subCategoryDal.Get(x => x.Id == entity.SubCategoryId);

            var attachments = _attachmentDal
                .GetAll(x => x.RequestId == entity.Id)
                .OrderByDescending(x => x.Id)
                .Select(x => new RequestAttachmentDto
                {
                    Id = x.Id,
                    Name = x.Name,
                    ContentType = x.ContentType,
                    SizeBytes = x.SizeBytes
                })
                .ToList();

            var history = _historyDal
                .GetAll(x => x.RequestId == entity.Id)
                .OrderByDescending(x => x.Id)
                .Select(x => new RequestStatusHistoryDto
                {
                    Id = x.Id,
                    FromStatus = x.FromStatus,
                    ToStatus = x.ToStatus,
                    Note = x.Note,
                    ActionByUserId = x.ActionByUserId,
                    CreatedAt = x.CreatedAt
                })
                .ToList();

            return new SuccessDataResult<RequestDetailDto>(new RequestDetailDto
            {
                Id = entity.Id,
                OwnerUserId = entity.UserId,
                CategoryId = entity.CategoryId,
                Category = category?.Name ?? $"Kategori ({entity.CategoryId})",
                SubCategoryId = entity.SubCategoryId,
                SubCategory = sub?.Name ?? $"Alt Kategori ({entity.SubCategoryId})",
                OtherText = entity.OtherText,
                Description = entity.Description,
                Status = TalepDurumuTurkish.ToTurkish(entity.Status),
                PayloadJson = string.IsNullOrWhiteSpace(entity.PayloadJson) ? "{}" : entity.PayloadJson,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt,
                Attachments = attachments,
                History = history
            });
        }

        [SecuredOperation(RoleNames.Admin)]
        public IDataResult<RequestListItemDto> AdminUpdate(long id, UpdateRequestDto dto)
        {
            if (!_userContext.IsAuthenticated)
                return new ErrorDataResult<RequestListItemDto>("Yetkilendirme gerekli.");
            if (id <= 0)
                return new ErrorDataResult<RequestListItemDto>("Geçersiz id.");

            dto ??= new UpdateRequestDto();
            var entity = _requestDal.Get(x => x.Id == id);
            if (entity == null)
                return new ErrorDataResult<RequestListItemDto>("Talep bulunamadı.");

            // Admin istenirse Reddedildi / Tamamlandı talepleri de düzenleyebilsin.
            // Sadece İptal Edildi son durum olarak kalsın.
            if (entity.Status == TalepDurumu.IptalEdildi)
                return new ErrorDataResult<RequestListItemDto>("İptal edilen talep güncellenemez.");

            var now = DateTime.UtcNow;
            var fromEnum = entity.Status;

            if (dto.CategoryId.HasValue && dto.CategoryId.Value > 0)
                entity.CategoryId = dto.CategoryId.Value;
            if (dto.SubCategoryId.HasValue && dto.SubCategoryId.Value > 0)
                entity.SubCategoryId = dto.SubCategoryId.Value;
            if (dto.Description != null)
                entity.Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim();
            if (dto.OtherText != null)
                entity.OtherText = string.IsNullOrWhiteSpace(dto.OtherText) ? null : dto.OtherText.Trim();
            if (dto.PayloadJson != null)
                entity.PayloadJson = NormalizeJson(dto.PayloadJson);

            if (!string.IsNullOrWhiteSpace(dto.Status))
            {
                if (!TalepDurumuTurkish.TryParseTurkish(dto.Status, out var parsedStatus))
                    return new ErrorDataResult<RequestListItemDto>("Geçersiz durum.");
                entity.Status = parsedStatus;
            }

            entity.UpdatedAt = now;
            entity.LastActionByUserId = _userContext.UserId;
            entity.LastActionNote = string.IsNullOrWhiteSpace(dto.Note) ? "Talep admin tarafından güncellendi." : dto.Note.Trim();
            _requestDal.Update(entity);

            var toEnum = entity.Status;
            _historyDal.Add(new RequestStatusHistory
            {
                RequestId = entity.Id,
                FromStatus = TalepDurumuTurkish.ToTurkish(fromEnum),
                ToStatus = TalepDurumuTurkish.ToTurkish(toEnum),
                ActionByUserId = _userContext.UserId,
                Note = entity.LastActionNote,
                CreatedAt = now
            });

            var category = _categoryDal.Get(x => x.Id == entity.CategoryId);
            var sub = _subCategoryDal.Get(x => x.Id == entity.SubCategoryId);

            if (fromEnum != toEnum)
                TryNotifyOwnerForStatusChange(entity, fromEnum, toEnum, category, sub, entity.LastActionNote);

            return new SuccessDataResult<RequestListItemDto>(MapListItem(entity, category, sub, ResolveOwnerName(entity.UserId)), "Güncellendi.");
        }

        public IDataResult<RequestListItemDto> UpdateMyDraft(long id, UpdateRequestDto dto)
        {
            if (!_userContext.IsAuthenticated)
                return new ErrorDataResult<RequestListItemDto>("Yetkilendirme gerekli.");
            if (id <= 0)
                return new ErrorDataResult<RequestListItemDto>("Geçersiz id.");

            dto ??= new UpdateRequestDto();
            var entity = _requestDal.Get(x => x.Id == id && x.UserId == _userContext.UserId);
            if (entity == null)
                return new ErrorDataResult<RequestListItemDto>("Talep bulunamadı.");

            var current = entity.Status;
            if (current != TalepDurumu.Taslak && current != TalepDurumu.EkBilgiBekleniyor)
                return new ErrorDataResult<RequestListItemDto>("Sadece taslak veya ek bilgi bekleyen talepler düzenlenebilir.");

            TalepDurumu? requestedStatus = null;
            if (!string.IsNullOrWhiteSpace(dto.Status) && TalepDurumuTurkish.TryParseTurkish(dto.Status, out var parsedDtoStatus))
                requestedStatus = parsedDtoStatus;

            if (current == TalepDurumu.EkBilgiBekleniyor && requestedStatus == TalepDurumu.Taslak)
                return new ErrorDataResult<RequestListItemDto>("Ek bilgi beklenirken talep Taslak yapılamaz.");

            var now = DateTime.UtcNow;
            var fromEnum = entity.Status;

            if (dto.CategoryId.HasValue && dto.CategoryId.Value > 0)
                entity.CategoryId = dto.CategoryId.Value;
            if (dto.SubCategoryId.HasValue && dto.SubCategoryId.Value > 0)
                entity.SubCategoryId = dto.SubCategoryId.Value;
            if (dto.Description != null)
                entity.Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim();
            if (dto.OtherText != null)
                entity.OtherText = string.IsNullOrWhiteSpace(dto.OtherText) ? null : dto.OtherText.Trim();
            if (dto.PayloadJson != null)
                entity.PayloadJson = NormalizeJson(dto.PayloadJson);

            if (requestedStatus.HasValue)
            {
                if (current == TalepDurumu.Taslak)
                {
                    if (requestedStatus.Value != TalepDurumu.Taslak && requestedStatus.Value != TalepDurumu.Gonderildi)
                        return new ErrorDataResult<RequestListItemDto>("Geçersiz durum geçişi.");
                    entity.Status = requestedStatus.Value;
                }
                else if (current == TalepDurumu.EkBilgiBekleniyor)
                {
                    if (requestedStatus.Value != TalepDurumu.Gonderildi && requestedStatus.Value != TalepDurumu.EkBilgiBekleniyor)
                        return new ErrorDataResult<RequestListItemDto>("Ek bilgi sonrası yalnızca güncelleme veya yeniden gönderim yapılabilir.");
                    entity.Status = requestedStatus.Value;
                }
            }

            // Gönderime geçerken zorunluluklar
            if (requestedStatus == TalepDurumu.Gonderildi)
            {
                if (entity.CategoryId <= 0 || entity.SubCategoryId <= 0)
                    return new ErrorDataResult<RequestListItemDto>("Göndermek için kategori ve alt kategori seçilmelidir.");

                var categoryCheck = _categoryDal.Get(x => x.Id == entity.CategoryId && x.IsActive);
                var subCheck = _subCategoryDal.Get(x => x.Id == entity.SubCategoryId && x.IsActive);
                if (categoryCheck == null || subCheck == null)
                    return new ErrorDataResult<RequestListItemDto>("Kategori/alt kategori bulunamadı.");

                var dynamicValidation = ValidateRequiredDynamicFields(entity.SubCategoryId, entity.PayloadJson);
                if (!dynamicValidation.Success)
                    return new ErrorDataResult<RequestListItemDto>(dynamicValidation.Message);
            }

            if (fromEnum == TalepDurumu.EkBilgiBekleniyor && entity.Status == TalepDurumu.Gonderildi)
                entity.AdminHighlightUserResubmit = true;

            entity.UpdatedAt = now;
            entity.LastActionByUserId = _userContext.UserId;
            entity.LastActionNote = string.IsNullOrWhiteSpace(dto.Note)
                ? (entity.Status == TalepDurumu.Taslak ? "Taslak güncellendi." : "Talep güncellendi.")
                : dto.Note.Trim();
            _requestDal.Update(entity);

            var toEnum = entity.Status;
            _historyDal.Add(new RequestStatusHistory
            {
                RequestId = entity.Id,
                FromStatus = TalepDurumuTurkish.ToTurkish(fromEnum),
                ToStatus = TalepDurumuTurkish.ToTurkish(toEnum),
                ActionByUserId = _userContext.UserId,
                Note = entity.LastActionNote,
                CreatedAt = now
            });

            var category = _categoryDal.Get(x => x.Id == entity.CategoryId);
            var sub = _subCategoryDal.Get(x => x.Id == entity.SubCategoryId);

            if (fromEnum != toEnum && toEnum == TalepDurumu.Gonderildi)
                TryNotifyAdminsForNewRequest(entity, category, sub);

            return new SuccessDataResult<RequestListItemDto>(MapListItem(entity, category, sub, ResolveOwnerName(entity.UserId)), "Güncellendi.");
        }

        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        public async Task<IDataResult<List<RequestAttachmentDto>>> AddAttachments(long requestId, List<IFormFile> attachments)
        {
            if (!_userContext.IsAuthenticated)
                return new ErrorDataResult<List<RequestAttachmentDto>>("Yetkilendirme gerekli.");
            if (requestId <= 0)
                return new ErrorDataResult<List<RequestAttachmentDto>>("Geçersiz requestId.");
            if (attachments == null || attachments.Count == 0)
                return new ErrorDataResult<List<RequestAttachmentDto>>("Dosya bulunamadı.");

            var req = _requestDal.Get(x => x.Id == requestId && x.UserId == _userContext.UserId);
            if (req == null)
                return new ErrorDataResult<List<RequestAttachmentDto>>("Talep bulunamadı.");

            var created = new List<RequestAttachmentDto>();
            foreach (var file in attachments)
            {
                if (file == null || file.Length == 0) continue;
                var saveRes = await _fileService.Save(file, FileType.TASK_ATTACHMENT); // aynı storage standardı
                if (!saveRes.Success || saveRes.Data == null) continue;

                var entity = new RequestAttachment
                {
                    RequestId = req.Id,
                    CreatorUserId = _userContext.UserId,
                    Name = saveRes.Data.Name,
                    AttachmentPath = saveRes.Data.FilePath,
                    ContentType = file.ContentType,
                    SizeBytes = file.Length
                };
                _attachmentDal.Add(entity);

                created.Add(new RequestAttachmentDto
                {
                    Id = entity.Id,
                    Name = entity.Name,
                    ContentType = entity.ContentType,
                    SizeBytes = entity.SizeBytes
                });
            }

            return new SuccessDataResult<List<RequestAttachmentDto>>(created, "Dosyalar yüklendi.");
        }

        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        public IDataResult<(byte[] Bytes, string ContentType, string FileName)> DownloadMyAttachment(long requestId, long attachmentId)
        {
            if (!_userContext.IsAuthenticated)
                return new ErrorDataResult<(byte[] Bytes, string ContentType, string FileName)>("Yetkilendirme gerekli.");

            var isAdmin = string.Equals(_userContext.RoleName, RoleNames.Admin, StringComparison.OrdinalIgnoreCase);
            var req = _requestDal.Get(x => x.Id == requestId && (isAdmin || x.UserId == _userContext.UserId));
            if (req == null)
                return new ErrorDataResult<(byte[] Bytes, string ContentType, string FileName)>("Talep bulunamadı.");

            var att = _attachmentDal.Get(x => x.Id == attachmentId && x.RequestId == requestId);
            if (att == null)
                return new ErrorDataResult<(byte[] Bytes, string ContentType, string FileName)>("Dosya bulunamadı.");

            // file-storage altında saklanıyor
            var full = Path.Combine(Directory.GetCurrentDirectory(), "file-storage", att.AttachmentPath);
            if (!System.IO.File.Exists(full))
                return new ErrorDataResult<(byte[] Bytes, string ContentType, string FileName)>("Dosya fiziksel olarak bulunamadı.");

            var bytes = System.IO.File.ReadAllBytes(full);
            var contentType = string.IsNullOrWhiteSpace(att.ContentType) ? "application/octet-stream" : att.ContentType;
            var fileName = string.IsNullOrWhiteSpace(att.Name) ? "attachment" : att.Name;
            return new SuccessDataResult<(byte[] Bytes, string ContentType, string FileName)>((bytes, contentType, fileName));
        }

        public IDataResult<RequestListItemDto> Cancel(long id, string? note = null)
        {
            if (!_userContext.IsAuthenticated)
                return new ErrorDataResult<RequestListItemDto>("Yetkilendirme gerekli.");

            var entity = _requestDal.Get(x => x.Id == id && x.UserId == _userContext.UserId);
            if (entity == null)
                return new ErrorDataResult<RequestListItemDto>("Talep bulunamadı.");

            var current = entity.Status;
            if (IsTerminalRequestStatus(current))
                return new ErrorDataResult<RequestListItemDto>("Bu talep iptal edilemez.");

            var fromEnum = entity.Status;
            var now = DateTime.UtcNow;
            entity.Status = TalepDurumu.IptalEdildi;
            entity.UpdatedAt = now;
            entity.LastActionByUserId = _userContext.UserId;
            entity.LastActionNote = string.IsNullOrWhiteSpace(note) ? "Kullanıcı iptal etti." : note.Trim();
            _requestDal.Update(entity);

            _historyDal.Add(new RequestStatusHistory
            {
                RequestId = entity.Id,
                FromStatus = TalepDurumuTurkish.ToTurkish(fromEnum),
                ToStatus = TalepDurumuTurkish.ToTurkish(entity.Status),
                ActionByUserId = _userContext.UserId,
                Note = entity.LastActionNote,
                CreatedAt = now
            });

            var category = _categoryDal.Get(x => x.Id == entity.CategoryId);
            RequestSubCategory? sub = null;
            sub = _subCategoryDal.Get(x => x.Id == entity.SubCategoryId);

            return new SuccessDataResult<RequestListItemDto>(MapListItem(entity, category, sub, ResolveOwnerName(entity.UserId)), "İptal edildi.");
        }

        public IResult DeleteMyDraft(long id)
        {
            if (!_userContext.IsAuthenticated)
                return new ErrorResult("Yetkilendirme gerekli.");
            if (id <= 0)
                return new ErrorResult("Geçersiz id.");

            var entity = _requestDal.Get(x => x.Id == id && x.UserId == _userContext.UserId);
            if (entity == null)
                return new ErrorResult("Talep bulunamadı.");
            if (entity.Status != TalepDurumu.Taslak)
                return new ErrorResult("Sadece taslak silinebilir.");

            _requestDal.Delete(entity);
            return new SuccessResult("Silindi.");
        }

        [SecuredOperation(RoleNames.Admin)]
        public IResult AdminDelete(long id)
        {
            if (!_userContext.IsAuthenticated)
                return new ErrorResult("Yetkilendirme gerekli.");
            if (id <= 0)
                return new ErrorResult("Geçersiz id.");

            var entity = _requestDal.Get(x => x.Id == id);
            if (entity == null)
                return new ErrorResult("Talep bulunamadı.");

            _requestDal.Delete(entity);
            return new SuccessResult("Silindi.");
        }

        private static bool IsTerminalRequestStatus(TalepDurumu s) =>
            s is TalepDurumu.Tamamlandi or TalepDurumu.Reddedildi or TalepDurumu.IptalEdildi;

        private void TryNotifyAdminsForNewRequest(Request entity, RequestCategory? category, RequestSubCategory? sub)
        {
            try
            {
                var requester = _userService.GetById(entity.UserId).Data;
                var requesterName = requester?.Name?.Trim() ?? $"UserId={entity.UserId}";
                var title = $"Yeni Talep · {(category?.Name ?? "Kategori")} / {(sub?.Name ?? "Alt Kategori")}";
                var content = $"{requesterName} yeni bir talep oluşturdu.\nKategori: {(category?.Name ?? "Kategori")} / {(sub?.Name ?? "Alt Kategori")}";

                _notificationService.SendAllByRoleName(new Entities.DTOs.NotificationDtos.AddNotificationDto
                {
                    Title = title,
                    Content = content,
                    Type = NotificationTypeKeys.RequestCreatedAdminQueue,
                    ReferenceId = entity.Id.ToString()
                }, RoleNames.Admin);
            }
            catch
            {
                // ignore
            }
        }

        private void TryNotifyOwnerForStatusChange(Request entity, TalepDurumu from, TalepDurumu to, RequestCategory? category, RequestSubCategory? sub, string? note)
        {
            try
            {
                var title = $"Talep Durumu Güncellendi · {(category?.Name ?? "Kategori")} / {(sub?.Name ?? "Alt Kategori")}";
                var fromTr = TalepDurumuTurkish.ToTurkish(from);
                var toTr = TalepDurumuTurkish.ToTurkish(to);
                var notePrefix = to switch
                {
                    TalepDurumu.Reddedildi => "Red nedeni",
                    TalepDurumu.EkBilgiBekleniyor => "Talep edilen ek bilgi",
                    _ => "Not"
                };
                var content = $"{fromTr} → {toTr}"
                    + (string.IsNullOrWhiteSpace(note) ? "" : $"\n{notePrefix}: {note}");

                _notificationService.Add(new Entities.DTOs.NotificationDtos.AddNotificationDto
                {
                    AssignedUserId = entity.UserId,
                    Title = title,
                    Content = content,
                    Type = NotificationTypeKeys.RequestStatusChanged,
                    ReferenceId = entity.Id.ToString()
                });

                if (to is TalepDurumu.Tamamlandi or TalepDurumu.Reddedildi or TalepDurumu.EkBilgiBekleniyor)
                    TrySendMailToOwner(entity.UserId, title, content);
            }
            catch
            {
                // ignore
            }
        }

        private void TrySendMailToOwner(long userId, string subject, string body)
        {
            var user = _userService.GetById(userId).Data;
            var to = user?.Email?.Trim();
            if (string.IsNullOrWhiteSpace(to))
                return;

            var mp = _smtpMailParametersProvider.GetUsableParameters();
            if (mp == null)
                return;

            try
            {
                _mailService.SendMail(new Entities.DTOs.SendMailDto
                {
                    MailParameters = mp,
                    ToEmail = to,
                    Subject = subject,
                    Body = body
                });
            }
            catch
            {
                // ignore
            }
        }

        /// <summary>
        /// Inbox/admin için kullanıcı adı: IUserService yerine IUserDal ile doğrudan DB'den okunur
        /// (proxy/secured katmanları yüzünden GetById boş dönebiliyordu).
        /// </summary>
        private static string FormatOwnerLabel(User? u, long userId)
        {
            if (u != null)
            {
                if (!string.IsNullOrWhiteSpace(u.Name))
                    return u.Name.Trim();
                if (!string.IsNullOrWhiteSpace(u.Email))
                    return u.Email.Trim();
            }

            return $"Kullanıcı ({userId})";
        }

        private Dictionary<long, string> BuildOwnerLabels(IEnumerable<long> userIds)
        {
            var ids = userIds.Distinct().ToList();
            var dict = new Dictionary<long, string>();
            if (ids.Count == 0)
                return dict;

            var users = _userDal.GetAll(u => ids.Contains(u.Id));
            var byId = users.ToDictionary(u => u.Id, u => u);
            foreach (var id in ids)
                dict[id] = byId.TryGetValue(id, out var u) ? FormatOwnerLabel(u, id) : FormatOwnerLabel(null, id);

            return dict;
        }

        private string ResolveOwnerName(long userId)
        {
            var u = _userDal.Get(p => p.Id == userId);
            return FormatOwnerLabel(u, userId);
        }

        private static RequestCategoryDto MapCategoryDto(RequestCategory c) =>
            new RequestCategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                SortOrder = c.SortOrder
            };

        private static RequestSubCategoryDto MapSubCategoryDto(RequestSubCategory s) =>
            new RequestSubCategoryDto
            {
                Id = s.Id,
                Name = s.Name,
                IsOther = s.IsOther,
                SortOrder = s.SortOrder
            };

        private static RequestSubCategoryFieldDto MapFieldDto(RequestSubCategoryField f) =>
            new RequestSubCategoryFieldDto
            {
                Id = f.Id,
                SubCategoryId = f.SubCategoryId,
                FieldKey = f.FieldKey,
                Label = f.Label,
                DataType = f.DataType,
                IsRequired = f.IsRequired,
                SortOrder = f.SortOrder
            };

        private IResult ValidateFieldDto(UpsertRequestSubCategoryFieldDto? dto, out UpsertRequestSubCategoryFieldDto normalized)
        {
            normalized = new UpsertRequestSubCategoryFieldDto();
            if (dto == null)
                return new ErrorResult("Dinamik alan bilgisi zorunludur.");

            var sub = _subCategoryDal.Get(x => x.Id == dto.SubCategoryId && x.IsActive);
            if (sub == null)
                return new ErrorResult("Alt kategori bulunamadı.");

            var label = (dto.Label ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(label))
                return new ErrorResult("Alan adı zorunludur.");

            var fieldKey = NormalizeFieldKey(dto.FieldKey);
            if (string.IsNullOrWhiteSpace(fieldKey))
                fieldKey = NormalizeFieldKey(label);
            if (string.IsNullOrWhiteSpace(fieldKey))
                return new ErrorResult("Alan anahtarı oluşturulamadı.");

            var dataType = NormalizeFieldType(dto.DataType);
            if (dataType == null)
                return new ErrorResult("Veri tipi metin, tarih veya dosya olmalıdır.");

            normalized = new UpsertRequestSubCategoryFieldDto
            {
                SubCategoryId = dto.SubCategoryId,
                FieldKey = fieldKey,
                Label = label,
                DataType = dataType,
                IsRequired = dto.IsRequired,
                SortOrder = dto.SortOrder,
                IsActive = dto.IsActive
            };

            return new SuccessResult();
        }

        private IResult ValidateRequiredDynamicFields(int subCategoryId, string payloadJson)
        {
            var requiredFields = _subCategoryFieldDal
                .GetAll(x => x.SubCategoryId == subCategoryId && x.IsActive && x.IsRequired)
                .ToList();
            if (requiredFields.Count == 0)
                return new SuccessResult();

            using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(payloadJson) ? "{}" : payloadJson);
            if (doc.RootElement.ValueKind != JsonValueKind.Object)
                return new ErrorResult("Dinamik alan verisi geçersiz.");

            foreach (var field in requiredFields)
            {
                if (!doc.RootElement.TryGetProperty(field.FieldKey, out var value) || IsJsonValueEmpty(value))
                    return new ErrorResult($"{field.Label} alanı zorunludur.");
            }

            return new SuccessResult();
        }

        private static bool IsJsonValueEmpty(JsonElement value)
        {
            return value.ValueKind switch
            {
                JsonValueKind.Null => true,
                JsonValueKind.Undefined => true,
                JsonValueKind.String => string.IsNullOrWhiteSpace(value.GetString()),
                JsonValueKind.Array => value.GetArrayLength() == 0,
                _ => false
            };
        }

        private static string NormalizeFieldKey(string? value)
        {
            var chars = (value ?? string.Empty)
                .Trim()
                .ToLowerInvariant()
                .Select(ch => char.IsLetterOrDigit(ch) ? ch : '_')
                .ToArray();
            var raw = new string(chars);
            while (raw.Contains("__", StringComparison.Ordinal))
                raw = raw.Replace("__", "_", StringComparison.Ordinal);
            return raw.Trim('_');
        }

        private static string? NormalizeFieldType(string? value)
        {
            var v = (value ?? string.Empty).Trim().ToLowerInvariant();
            return v switch
            {
                "text" or "metin" => "text",
                "date" or "tarih" => "date",
                "file" or "dosya" => "file",
                _ => null
            };
        }

        private static RequestListItemDto MapListItem(Request x, RequestCategory? c, RequestSubCategory? s, string? ownerName = null, bool forAdminInbox = false) =>
            new RequestListItemDto
            {
                Id = x.Id,
                CategoryId = x.CategoryId,
                Category = c?.Name ?? $"Kategori ({x.CategoryId})",
                SubCategoryId = x.SubCategoryId,
                SubCategory = s?.Name,
                OtherText = x.OtherText,
                OwnerName = ownerName,
                Description = x.Description,
                Status = TalepDurumuTurkish.ToTurkish(x.Status),
                InboxHighlightText = forAdminInbox && x.AdminHighlightUserResubmit
                    ? "Güncellendi"
                    : null,
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt
            };

        private static string NormalizeJson(string? payloadJson)
        {
            if (string.IsNullOrWhiteSpace(payloadJson))
                return "{}";
            try
            {
                using var doc = JsonDocument.Parse(payloadJson);
                return doc.RootElement.ValueKind == JsonValueKind.Undefined
                    ? "{}"
                    : doc.RootElement.GetRawText();
            }
            catch
            {
                // Geçersiz JSON => frontend hatası. 400 döndürelim yerine boş kaydetmeyelim.
                // Fakat mevcut mimaride manager bazen yumuşak davranıyor; burada sertleşiyoruz:
                throw new ArgumentException("PayloadJson geçersiz JSON.");
            }
        }
    }
}

