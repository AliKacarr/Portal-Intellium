using Business.BusinessAspects; // ✅ LoggerAspect için
using Business.Repository.DebitRequestRepository;
using Business.Repository.NotificationRepository;
using Business.Repository.MailRepository;
using Business.Helpers;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using Business.Repository.DebitRepository;
using DataAccess.Repository.DebitRequestRepository;
using DataAccess.Repository.DebitRepository;
using DataAccess.Repository.ProductRepository;
using DataAccess.Repository.UserRepository;
using Entities.Concrete;
using Entities.DTOs;
using Entities.DTOs.NotificationDtos;
using Entities.Enums;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Business.Repository.DebitRequestRepository
{
    public class DebitRequestManager : IDebitRequestService
    {
        private readonly IDebitRequestDal _debitRequestDal;
        private readonly IDebitDal _debitDal;
        private readonly IUserDal _userDal;
        private readonly IProductDal _productDal;
        private readonly INotificationService _notificationService;
        private readonly IDebitService _debitService;
        private readonly IMailService _mailService;
        private readonly ISmtpMailParametersProvider _smtpMailParametersProvider;
        private readonly IConfiguration _configuration;

        public DebitRequestManager(
            IDebitRequestDal debitRequestDal,
            IDebitDal debitDal,
            IUserDal userDal,
            IProductDal productDal,
            INotificationService notificationService,
            IDebitService debitService,
            IMailService mailService,
            ISmtpMailParametersProvider smtpMailParametersProvider,
            IConfiguration configuration)
        {
            _debitRequestDal = debitRequestDal;
            _debitDal = debitDal;
            _userDal = userDal;
            _productDal = productDal;
            _notificationService = notificationService;
            _debitService = debitService;
            _mailService = mailService;
            _smtpMailParametersProvider = smtpMailParametersProvider;
            _configuration = configuration;
        }

        private string ResolvePortalUrl(string path)
        {
            var baseUrl = (_configuration["Links:PortalFrontendBaseUrl"] ?? "").Trim().TrimEnd('/');
            if (string.IsNullOrWhiteSpace(baseUrl))
                return string.Empty;
            if (string.IsNullOrWhiteSpace(path))
                return baseUrl;
            return $"{baseUrl}/{path.TrimStart('/')}";
        }

        private void TrySendMailToUser(long userId, string subject, string body)
        {
            try
            {
                var user = _userDal.Get(u => u.Id == userId);
                var to = user?.Email?.Trim();
                if (string.IsNullOrWhiteSpace(to))
                    return;

                var mp = _smtpMailParametersProvider.GetUsableParameters();
                if (mp == null)
                    return;

                _mailService.SendMail(new SendMailDto
                {
                    MailParameters = mp,
                    ToEmail = to,
                    Subject = subject,
                    Body = body
                });
            }
            catch
            {
                // Mail hatası talep akışını bozmasın.
            }
        }

        // 🔥 LOGLAMA EKLENDİ: Zimmet talebi oluşturulduğunda log düşer.
        [LoggerAspect]
        public IResult Add(DebitRequest debitRequest)
        {
            if (string.Equals(debitRequest.RequestKind, "Return", StringComparison.OrdinalIgnoreCase))
            {
                return AddReturnRequest(debitRequest);
            }

            var isInventoryProductRequest = debitRequest.ProductId != null && debitRequest.ProductId > 0;
            var isNewProductRequest =
                !string.IsNullOrWhiteSpace(debitRequest.RequestedCategory) ||
                !string.IsNullOrWhiteSpace(debitRequest.RequestedBrand) ||
                !string.IsNullOrWhiteSpace(debitRequest.RequestedModel);

            if (!isInventoryProductRequest && !isNewProductRequest)
            {
                return new ErrorResult("Lütfen bir ürün seçin veya yeni ürün talebi için alanları doldurun.");
            }

            Product? product = null;
            if (isInventoryProductRequest)
            {
                product = _productDal.Get(p => p.Id == debitRequest.ProductId!.Value);
                if (product == null)
                {
                    return new ErrorResult("Seçilen ürün bulunamadı.");
                }
            }

            debitRequest.RequestDate = DateTime.Now;
            if (product != null)
            {
                // Ürün depoda değilse talep oluşturulsun ama "Stok Bekliyor" durumuna düşsün.
                debitRequest.Status = string.Equals(product.Status, "Depoda", StringComparison.OrdinalIgnoreCase)
                    ? "Bekliyor"
                    : "Stok Bekliyor";
                // Backward uyumluluk / raporlar için Category alanını ürün kategorisinden doldur.
                debitRequest.Category = product.Category;
            }
            else
            {
                // Envanterde yok → yeni ürün talebi
                debitRequest.Status = "Envanter Bekliyor";
                debitRequest.Category = debitRequest.RequestedCategory ?? debitRequest.Category ?? "Diğer";
            }
            _debitRequestDal.Add(debitRequest);

            var user = _userDal.Get(u => u.Id == debitRequest.UserId);
            var productLabel =
                product != null
                    ? $"[{product.Category}] {product.Brand} {product.Model} - SN: {product.SerialNumber}"
                    : $"[{debitRequest.RequestedCategory}] {debitRequest.RequestedBrand} {debitRequest.RequestedModel}".Trim();
            var stockNote =
                product != null && !string.Equals(product.Status, "Depoda", StringComparison.OrdinalIgnoreCase)
                    ? $" (stokta değil: {product.Status})"
                    : (product == null ? " (envanterde yok)" : "");
            AddNotificationDto notification = new()
            {
                Title = "Yeni Zimmet Talebi",
                Content = $"{user.Name} ürün talebinde bulundu: {productLabel}{stockNote}",
                Type = NotificationTypes.Debit.ToString()
            };
            _notificationService.SendAllByRoleName(notification, "admin"); 

            return new SuccessResult("Zimmet talebi oluşturuldu.");
        }

        private IResult AddReturnRequest(DebitRequest debitRequest)
        {
            if (debitRequest.ProductId == null || debitRequest.ProductId <= 0)
            {
                return new ErrorResult("İade talebi için ürün bilgisi zorunludur.");
            }

            if (debitRequest.RelatedDebitId == null || debitRequest.RelatedDebitId <= 0)
            {
                return new ErrorResult("İade talebi için zimmet kaydı zorunludur.");
            }

            var debitEntity = _debitService.GetById(debitRequest.RelatedDebitId.Value);
            if (!debitEntity.Success || debitEntity.Data == null)
            {
                return new ErrorResult("Zimmet kaydı bulunamadı.");
            }

            var debitData = debitEntity.Data;
            if (debitData.ReceiverUserId != debitRequest.UserId)
            {
                return new ErrorResult("Bu zimmet kaydı size ait değil.");
            }

            if (debitData.ProductId != debitRequest.ProductId.Value)
            {
                return new ErrorResult("Seçilen ürün ile zimmet kaydı eşleşmiyor.");
            }

            var product = _productDal.Get(p => p.Id == debitRequest.ProductId.Value);
            if (product == null)
            {
                return new ErrorResult("Ürün bulunamadı.");
            }

            var relatedId = debitRequest.RelatedDebitId.Value;
            // EF Core: StringComparison içeren string.Equals SQL'e çevrilemez; RequestKind kayıtta "Return" olarak tutulur.
            var pendingReturn = _debitRequestDal
                .GetAll(r =>
                    r.RelatedDebitId == relatedId &&
                    r.RequestKind == "Return" &&
                    (r.Status == "Bekliyor" || r.Status == "Stok Bekliyor"))
                .FirstOrDefault();

            if (pendingReturn != null)
            {
                return new ErrorResult("Bu zimmet için zaten bekleyen bir iade talebi var.");
            }

            debitRequest.RequestKind = "Return";
            debitRequest.RequestDate = DateTime.Now;
            debitRequest.Status = "Bekliyor";
            debitRequest.Category = product.Category;
            if (string.IsNullOrWhiteSpace(debitRequest.Description))
            {
                debitRequest.Description = string.Empty;
            }

            debitRequest.RequestedCategory = null;
            debitRequest.RequestedBrand = null;
            debitRequest.RequestedModel = null;

            _debitRequestDal.Add(debitRequest);

            var user = _userDal.Get(u => u.Id == debitRequest.UserId);
            var productLabel = $"[{product.Category}] {product.Brand} {product.Model} - SN: {product.SerialNumber}";
            AddNotificationDto notification = new()
            {
                Title = "Yeni İade Talebi",
                Content = $"{user.Name} ürün iadesi talep etti: {productLabel}",
                Type = NotificationTypes.Debit.ToString()
            };
            _notificationService.SendAllByRoleName(notification, "admin");

            return new SuccessResult("İade talebi oluşturuldu.");
        }

        // 🔥 LOGLAMA EKLENDİ: Zimmet talebi güncellendiğinde log düşer.
        [LoggerAspect]
        public IResult Update(DebitRequest debitRequest)
        {
            if (string.Equals(debitRequest.RequestKind, "Return", StringComparison.OrdinalIgnoreCase))
            {
                _debitRequestDal.Update(debitRequest);
                return new SuccessResult("Talep güncellendi.");
            }

            // Talep güncellenirken ürün seçimi değiştiyse category'yi güncelle.
            if (debitRequest.ProductId != null && debitRequest.ProductId > 0)
            {
                var product = _productDal.Get(p => p.Id == debitRequest.ProductId.Value);
                if (product == null)
                {
                    return new ErrorResult("Seçilen ürün bulunamadı.");
                }
                debitRequest.Category = product.Category;
                debitRequest.Status = string.Equals(product.Status, "Depoda", StringComparison.OrdinalIgnoreCase)
                    ? "Bekliyor"
                    : "Stok Bekliyor";
                debitRequest.RequestedCategory = null;
                debitRequest.RequestedBrand = null;
                debitRequest.RequestedModel = null;
            }
            else
            {
                // Envanterde yok talebi
                if (!string.IsNullOrWhiteSpace(debitRequest.RequestedCategory) ||
                    !string.IsNullOrWhiteSpace(debitRequest.RequestedBrand) ||
                    !string.IsNullOrWhiteSpace(debitRequest.RequestedModel))
                {
                    debitRequest.Status = "Envanter Bekliyor";
                    debitRequest.Category = debitRequest.RequestedCategory ?? debitRequest.Category ?? "Diğer";
                }
            }
            _debitRequestDal.Update(debitRequest);
            return new SuccessResult("Talep güncellendi.");
        }

        public IDataResult<DebitRequest> GetById(int id)
        {
            return new SuccessDataResult<DebitRequest>(_debitRequestDal.Get(d => d.Id == id));
        }

        public IDataResult<List<DebitRequestDto>> GetAllDto()
        {
             var requests = _debitRequestDal.GetAll();
            var users = _userDal.GetAll();
            var products = _productDal.GetAll();

            // Aynı ürün için daha önce onaylanmış talep var mı? (admin uyarısı için)
            var approvedByProductId = requests
                .Where(r => r.ProductId != null && r.ProductId > 0 && r.Status == "Onaylandı")
                .GroupBy(r => r.ProductId!.Value)
                .ToDictionary(g => g.Key, g => g.First());

            var result = from r in requests
                         join u in users on r.UserId equals u.Id
                         join p in products on r.ProductId equals p.Id into prodLeft
                         from p in prodLeft.DefaultIfEmpty()
                         orderby r.RequestDate descending
                         select new DebitRequestDto
                         {
                             Id = r.Id,
                             UserId = r.UserId,
                             UserName = u.Name, 
                             ProductId = r.ProductId,
                             ProductLabel = p == null ? null : $"[{p.Category}] {p.Brand} {p.Model} - SN: {p.SerialNumber}",
                             ProductStatus = p == null ? null : p.Status,
                             RequestedCategory = r.RequestedCategory,
                             RequestedBrand = r.RequestedBrand,
                             RequestedModel = r.RequestedModel,
                             AdminWarning =
                                (r.ProductId != null && r.ProductId > 0 && (r.Status == "Bekliyor" || r.Status == "Stok Bekliyor") &&
                                 approvedByProductId.ContainsKey(r.ProductId.Value) && approvedByProductId[r.ProductId.Value].Id != r.Id)
                                    ? "Bu ürün başka bir talepte onaylanmış olabilir (başka bir kullanıcıya verildi)."
                                    : null,
                             Category = r.Category,
                             Description = r.Description,
                             Status = r.Status,
                             RequestDate = r.RequestDate,
                             RequestKind = string.IsNullOrWhiteSpace(r.RequestKind) ? "Assignment" : r.RequestKind,
                             RelatedDebitId = r.RelatedDebitId
                         };

            var list = result.ToList();
            ApplyDebitDeliveryStatusToRequests(list);
            return new SuccessDataResult<List<DebitRequestDto>>(list);
        }

        /// <summary>Zimmet kaydı teslim edildiyse talep statüsünü senkronize eder (liste + DB).</summary>
        private void ApplyDebitDeliveryStatusToRequests(List<DebitRequestDto> list)
        {
            if (list == null || list.Count == 0) return;

            var debits = _debitDal.GetAll();
            var delivered = new HashSet<(long UserId, int ProductId)>(
                debits
                    .Where(d => string.Equals(d.Status, DebitStatusTexts.Delivered, StringComparison.OrdinalIgnoreCase))
                    .Select(d => (d.ReceiverUserId, d.ProductId)));
            var sent = new HashSet<(long UserId, int ProductId)>(
                debits
                    .Where(d => string.Equals(d.Status, DebitStatusTexts.Sent, StringComparison.OrdinalIgnoreCase))
                    .Select(d => (d.ReceiverUserId, d.ProductId)));

            foreach (var dto in list)
            {
                if (!dto.ProductId.HasValue || dto.ProductId <= 0) continue;
                if (!string.Equals(dto.RequestKind, "Assignment", StringComparison.OrdinalIgnoreCase)) continue;

                var key = ((long)dto.UserId, dto.ProductId.Value);
                var st = dto.Status ?? "";

                if (delivered.Contains(key))
                {
                    if (st is "Bekliyor" or "Onaylandı")
                    {
                        dto.Status = "Teslim Alındı";
                        var entity = _debitRequestDal.Get(d => d.Id == dto.Id);
                        if (entity != null && entity.Status is "Bekliyor" or "Onaylandı")
                        {
                            entity.Status = "Teslim Alındı";
                            _debitRequestDal.Update(entity);
                        }
                    }
                }
                else if (sent.Contains(key) && (st == "Bekliyor" || st == "Onaylandı"))
                {
                    dto.Status = "Teslim Bekleniyor";
                }
            }
        }

        // 🔥 LOGLAMA EKLENDİ: Talep reddedildiğinde log düşer.
        [LoggerAspect]
        public IResult Reject(int id)
        {
            var req = _debitRequestDal.Get(d => d.Id == id);
            if (req == null) return new ErrorResult("Talep bulunamadı.");

            req.Status = "Reddedildi";
            _debitRequestDal.Update(req);

            AddNotificationDto notification = new()
            {
                AssignedUserId = req.UserId, 
                Title = "Zimmet Talebi Reddedildi",
                Content = $"{(req.ProductId != null ? "Ürün" : "Kategori")} talebiniz reddedildi.",
                Type = NotificationTypes.Debit.ToString()
            };
            _notificationService.Add(notification);

            TrySendMailToUser(
                req.UserId,
                subject: "Zimmet talebiniz reddedildi",
                body: DebitWorkflowMailTemplates.BuildRequestRejectedHtml(
                    fullName: _userDal.Get(u => u.Id == req.UserId)?.Name ?? "Kullanıcı",
                    portalUrl: ResolvePortalUrl("/dashboard/my-requests")));

            return new SuccessResult("Talep reddedildi.");
        }

        // 🔥 LOGLAMA EKLENDİ: Talep onaylandığında log düşer.
        [LoggerAspect]
        public IResult Complete(int id)
        {
            var req = _debitRequestDal.Get(d => d.Id == id);
            if (req == null) return new ErrorResult("Talep bulunamadı.");

            if (string.Equals(req.RequestKind, "Return", StringComparison.OrdinalIgnoreCase))
            {
                if (req.ProductId == null || req.ProductId <= 0 || req.RelatedDebitId == null || req.RelatedDebitId <= 0)
                {
                    return new ErrorResult("İade talebi için ürün veya zimmet bilgisi eksik.");
                }

                var debitResult = _debitService.GetById(req.RelatedDebitId.Value);
                if (!debitResult.Success || debitResult.Data == null)
                {
                    return new ErrorResult("Zimmet kaydı bulunamadı.");
                }

                var debit = debitResult.Data;
                if (debit.ProductId != req.ProductId.Value || debit.ReceiverUserId != req.UserId)
                {
                    return new ErrorResult("İade talebi ile zimmet kaydı eşleşmiyor.");
                }

                var deleteResult = _debitService.Delete(debit);
                if (!deleteResult.Success)
                {
                    return deleteResult;
                }

                req.Status = "Onaylandı";
                _debitRequestDal.Update(req);

                AddNotificationDto returnApprovedNotif = new()
                {
                    AssignedUserId = req.UserId,
                    Title = "İade Talebi Onaylandı",
                    Content = "Ürün iade talebiniz onaylandı ve envantere alındı.",
                    Type = NotificationTypes.Debit.ToString()
                };
                _notificationService.Add(returnApprovedNotif);

                return new SuccessResult("İade talebi onaylandı.");
            }

            // Yeni akış: ürün bazlı stok kontrolü
            if (req.ProductId != null && req.ProductId > 0)
            {
                var product = _productDal.Get(p => p.Id == req.ProductId.Value);
                if (product == null)
                {
                    return new ErrorResult("Seçilen ürün bulunamadı.");
                }
                if (!string.Equals(product.Status, "Depoda", StringComparison.OrdinalIgnoreCase))
                {
                    return new ErrorResult("Seçilen ürün stokta yok. Lütfen başka bir ürün seçin.");
                }
            }

            req.Status = "Onaylandı";
            _debitRequestDal.Update(req);

            AddNotificationDto notification = new()
            {
                AssignedUserId = req.UserId,
                Title = "Zimmet Talebi Onaylandı",
                Content = "Zimmet talebiniz onaylandı ve zimmet kaydı oluşturuldu.",
                Type = NotificationTypes.Debit.ToString()
            };
            _notificationService.Add(notification);

            TrySendMailToUser(
                req.UserId,
                subject: "Zimmet talebiniz onaylandı",
                body: DebitWorkflowMailTemplates.BuildRequestApprovedHtml(
                    fullName: _userDal.Get(u => u.Id == req.UserId)?.Name ?? "Kullanıcı",
                    portalUrl: ResolvePortalUrl("/dashboard/my-requests")));

            return new SuccessResult("Talep onaylandı.");
        }

        /// <inheritdoc />
        public IResult MarkAssignmentRequestDelivered(long receiverUserId, int productId)
        {
            if (receiverUserId <= 0 || productId <= 0)
                return new SuccessResult();

            var req = _debitRequestDal
                .GetAll(r =>
                    r.UserId == receiverUserId
                    && r.ProductId == productId
                    && r.RequestKind == "Assignment"
                    && (r.Status == "Bekliyor" || r.Status == "Onaylandı"))
                .OrderByDescending(r => r.RequestDate)
                .FirstOrDefault();

            if (req == null)
                return new SuccessResult();

            req.Status = "Teslim Alındı";
            _debitRequestDal.Update(req);
            return new SuccessResult();
        }
    }
}