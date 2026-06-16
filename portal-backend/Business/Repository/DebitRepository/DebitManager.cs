using Business.BusinessAspects; // ✅ LoggerAspect için
using Business.Helpers.DebitHelpers;
using Business.Helpers;
using Business.Repository.MailRepository;
using Business.Repository.ProductRepository;
using Business.Repository.NotificationRepository;
using DataAccess.Repository.DebitRequestRepository;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using Microsoft.Extensions.Configuration;
using DataAccess.Repository.DebitRepository;
using DataAccess.Repository.UserRepository;
using DataAccess.Repository.UserJobDetailRepository;
using DataAccess.Repository.UserJobExperienceRepository;
using Entities.Concrete;
using Entities.DTOs;
using Entities.DTOs.NotificationDtos;
using Entities.Enums;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Business.Repository.DebitRepository
{
    public class DebitManager : IDebitService
    {
        private readonly IDebitDal _debitDal;
        private readonly IUserDal _userDal;
        private readonly IProductService _productService;
        private readonly GetDebitPDFPath _getDebitPDFPath;
        private readonly INotificationService _notificationService;
        private readonly IMailService _mailService;
        private readonly ISmtpMailParametersProvider _smtpMailParametersProvider;
        private readonly IConfiguration _configuration;
        private readonly IUserJobDetailDal _userJobDetailDal;
        private readonly IUserJobExperienceDal _userJobExperienceDal;
        private readonly IDebitRequestDal _debitRequestDal;

        public DebitManager(
            IDebitDal debitDal, 
            IUserDal userDal, 
            IProductService productService, 
            GetDebitPDFPath getDebitPDFPath, 
            INotificationService notificationService,
            IMailService mailService,
            ISmtpMailParametersProvider smtpMailParametersProvider,
            IConfiguration configuration,
            IUserJobDetailDal userJobDetailDal,
            IUserJobExperienceDal userJobExperienceDal,
            IDebitRequestDal debitRequestDal)
        {
            _debitDal = debitDal;
            _userDal = userDal;
            _productService = productService;
            _getDebitPDFPath = getDebitPDFPath;
            _notificationService = notificationService;
            _mailService = mailService;
            _smtpMailParametersProvider = smtpMailParametersProvider;
            _configuration = configuration;
            _userJobDetailDal = userJobDetailDal;
            _userJobExperienceDal = userJobExperienceDal;
            _debitRequestDal = debitRequestDal;
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

        private void TrySendMailToReceiver(long receiverUserId, string subject, string body)
        {
            try
            {
                var user = _userDal.Get(u => u.Id == receiverUserId);
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
                // Mail hatası zimmet akışını bozmasın.
            }
        }

        private string GetUserTitle(long userId)
        {
            var user = _userDal.Get(x => x.Id == userId);

            // Öncelik: UserJobDetails (sistemde aktif iş bilgisi buradan yönetiliyor)
            var jobDetail = _userJobDetailDal.Get(x => x.UserId == userId && x.IsActive);
            if (!string.IsNullOrWhiteSpace(jobDetail?.JobTitle))
                return jobDetail.JobTitle!.Trim();

            // Geriye dönük uyumluluk: eski tabloda (UserJobExperience) aktif kayıt varsa onu kullan
            var experiences = _userJobExperienceDal.GetAll(x => x.UserId == userId);
            var currentJob = experiences.FirstOrDefault(x => x.DepartureDate == null);
            if (!string.IsNullOrWhiteSpace(currentJob?.JobTitle))
                return currentJob.JobTitle.Trim();

            // En azından son deneyimi dene (departureDate dolu olsa bile)
            var lastJob = experiences
                .OrderByDescending(x => x.StartDate)
                .FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(lastJob?.JobTitle))
                return lastJob.JobTitle.Trim();

            // Son çare: rol/claim üzerinden ünvan üret (özellikle admin hesaplarda iş detayı boş olabiliyor)
            if (user != null)
            {
                var claims = _userDal.GetClaims(user, customerId: 0) ?? new List<OperationClaim>();
                var claimNames = claims
                    .Select(c => (c?.Name ?? "").Trim().ToLowerInvariant())
                    .Where(n => !string.IsNullOrWhiteSpace(n))
                    .ToHashSet();

                if (claimNames.Contains(RoleNames.Admin))
                    return "Admin";
                if (claimNames.Contains(RoleNames.Worker) || claimNames.Contains(RoleNames.WorkerOutsource) || claimNames.Contains(RoleNames.WorkerOutsourced))
                    return "Çalışan";
                if (claimNames.Contains(RoleNames.User))
                    return "Kullanıcı";
            }

            return "Personel";
        }

        // 🔥 LOGLAMA EKLENDİ: Zimmet oluşturulduğunda log düşer.
        [LoggerAspect] 
        public IResult Add(Debit debit)
        {
            // 1. Ürün Kontrolleri
            var productResult = _productService.GetById(debit.ProductId);
            if (!productResult.Success || productResult.Data == null) return new ErrorResult("Ürün bulunamadı.");
            var product = productResult.Data;
            
            if (product.Quantity <= 0)
            {
                return new ErrorResult("Bu ürün stokta yok.");
            }

            // Handshake: önce "Gönderildi"; alıcı onayı veya admin ile "Teslim Edildi" + tutanak
            debit.Status = DebitStatusTexts.Sent;
            debit.DeliveryDate = DateTime.UtcNow;
            debit.PdfFile = null;

            // 3. Veritabanı İşlemleri
            _debitDal.Add(debit);
            
            // Stoktan 1 düş
            product.Quantity = Math.Max(0, product.Quantity - 1);
            product.Status = product.Quantity > 0 ? "Depoda" : "Zimmetli";
            product.CurrentDebitId = debit.Id; // Son zimmet kaydı
            var updateResult = _productService.Update(product);
            if (!updateResult.Success)
            {
                try
                {
                    _debitDal.Delete(debit);
                }
                catch (Exception exDel)
                {
                    Console.WriteLine("Zimmet geri alma (ürün güncellenemedi): " + exDel.Message);
                }

                return updateResult;
            }

            // Kullanıcıya mail: Zimmet gönderildi (admin değil alıcı)
            var assignedHtml = DebitWorkflowMailTemplates.BuildAssignedHtml(
                fullName: _userDal.Get(u => u.Id == debit.ReceiverUserId)?.Name ?? "Kullanıcı",
                productText: $"{product.Category} {product.Brand} {product.Model} (SN: {product.SerialNumber})",
                portalUrl: ResolvePortalUrl("/dashboard/my-assets"));
            TrySendMailToReceiver(debit.ReceiverUserId, subject: "Zimmet gönderildi", body: assignedHtml);

            return new SuccessResult(DebitMessages.AddedDebit);
        }

        // 🔥 LOGLAMA EKLENDİ: Zimmet güncellendiğinde log düşer.
        [LoggerAspect]
        public IResult Update(Debit debit)
        {
            var productResult = _productService.GetById(debit.ProductId);
            var product = productResult.Data;
            
            var receiverUser = _userDal.Get(x => x.Id == debit.ReceiverUserId);
            var delivererUser = _userDal.Get(x => x.Id == debit.DeliveredUserId);
            string receiverTitle = GetUserTitle(debit.ReceiverUserId);

            try 
            {
                debit.PdfFile = _getDebitPDFPath.CreateDebitPdf(debit, receiverUser, receiverTitle, product, delivererUser);
            }
            catch (Exception ex)
            {
                Console.WriteLine("PDF Güncelleme Hatası: " + ex.Message);
            }

            _debitDal.Update(debit);
            return new SuccessResult("Zimmet bilgileri ve tutanağı güncellendi.");
        }

        // 🔥 LOGLAMA EKLENDİ: Zimmet silindiğinde log düşer.
        [LoggerAspect]
        public IResult Delete(Debit debit)
        {
            var product = _productService.GetById(debit.ProductId).Data;
            if (product != null)
            {
                var st = debit.Status ?? "";
                var isDelivered = string.Equals(st, DebitStatusTexts.Delivered, StringComparison.OrdinalIgnoreCase);
                var isSent = string.Equals(st, DebitStatusTexts.Sent, StringComparison.OrdinalIgnoreCase);
                var isFailed = string.Equals(st, DebitStatusTexts.DeliveryFailed, StringComparison.OrdinalIgnoreCase);

                // Teslim Edildi / Gönderildi: stok hâlâ rezerve → silince stoğa 1 ekle
                if (isDelivered || isSent)
                {
                    product.Quantity = product.Quantity + 1;
                    product.Status = "Depoda";
                }

                // Teslim Edilemedi: stok FinalizeHandshakeFailure ile zaten iade edildi; yalnızca CurrentDebitId temizliği
                if (isFailed || isDelivered || isSent)
                {
                    if (product.CurrentDebitId == debit.Id)
                        product.CurrentDebitId = 0;
                }

                _productService.Update(product);
            }

            _debitDal.Delete(debit);
            return new SuccessResult(DebitMessages.DeletedDebit);
        }
        
        public IDataResult<Debit> GetById(int id)
        {
            return new SuccessDataResult<Debit>(_debitDal.Get(x => x.Id == id));
        }

        public IDataResult<List<DebitDetailDto>> GetAllDebitsDto()
        {
            var debits = _debitDal.GetAll(); 
            var products = _productService.GetAll().Data;

            var dtoList = from d in debits
                          join p in products on d.ProductId equals p.Id
                          select new DebitDetailDto
                          {
                              Id = d.Id,
                              ProductId = p.Id,
                              Category = p.Category,
                              ProductInfo = p.Brand + " " + p.Model, 
                              SerialNumber = p.SerialNumber,
                              TechnicalSpecs = p.TechnicalSpecs, 
                              ReceiverUserId = d.ReceiverUserId,
                              DeliveredUserId = d.DeliveredUserId,
                              DeliveryDate = d.DeliveryDate,
                              Status = d.Status,
                              PdfPath = (d.PdfFile != null && d.PdfFile.Length > 0) 
                                      ? $"/api/debit/download/{d.Id}" 
                                      : null
                          };

            return new SuccessDataResult<List<DebitDetailDto>>(dtoList.ToList());
        }

        public IDataResult<string> GenerateDebitPdf(int debitId)
        {
            return new SuccessDataResult<string>($"/api/debit/download/{debitId}", "PDF bağlantısı hazır."); 
        }

        [LoggerAspect]
        public IResult ConfirmDeliveryByReceiver(int debitId, long receiverUserId)
        {
            var debitResult = GetById(debitId);
            if (!debitResult.Success || debitResult.Data == null)
                return new ErrorResult("Zimmet kaydı bulunamadı.");

            var debit = debitResult.Data;
            if (!string.Equals(debit.Status, DebitStatusTexts.Sent, StringComparison.OrdinalIgnoreCase))
                return new ErrorResult("Bu kayıt teslim alma onayı beklemiyor.");

            if (debit.ReceiverUserId != receiverUserId)
                return new ErrorResult("Bu zimmet kaydını onaylama yetkiniz yok.");

            return FinalizeHandshakeDelivery(debit);
        }

        [LoggerAspect]
        public IResult MarkDeliveredByAdmin(int debitId)
        {
            var debitResult = GetById(debitId);
            if (!debitResult.Success || debitResult.Data == null)
                return new ErrorResult("Zimmet kaydı bulunamadı.");

            var debit = debitResult.Data;
            if (!string.Equals(debit.Status, DebitStatusTexts.Sent, StringComparison.OrdinalIgnoreCase))
                return new ErrorResult("Bu kayıt bekleyen gönderim statüsünde değil.");

            return FinalizeHandshakeDelivery(debit);
        }

        private void SyncAssignmentRequestDelivered(long receiverUserId, int productId)
        {
            if (receiverUserId <= 0 || productId <= 0) return;

            var req = _debitRequestDal
                .GetAll(r =>
                    r.UserId == receiverUserId
                    && r.ProductId == productId
                    && r.RequestKind == "Assignment"
                    && (r.Status == "Bekliyor" || r.Status == "Onaylandı"))
                .OrderByDescending(r => r.RequestDate)
                .FirstOrDefault();

            if (req == null) return;

            req.Status = "Teslim Alındı";
            _debitRequestDal.Update(req);
        }

        private IResult FinalizeHandshakeDelivery(Debit debit)
        {
            debit.Status = DebitStatusTexts.Delivered;
            debit.DeliveryDate = DateTime.UtcNow;
            var result = Update(debit);

            if (result.Success)
            {
                SyncAssignmentRequestDelivered(debit.ReceiverUserId, debit.ProductId);

                var html = DebitWorkflowMailTemplates.BuildDeliveredHtml(
                    fullName: _userDal.Get(u => u.Id == debit.ReceiverUserId)?.Name ?? "Kullanıcı",
                    portalUrl: ResolvePortalUrl("/dashboard/my-assets"));
                TrySendMailToReceiver(debit.ReceiverUserId, subject: "Zimmet teslim alındı", body: html);
            }

            return result;
        }

        [LoggerAspect]
        public IResult MarkDeliveryFailedByReceiver(int debitId, long receiverUserId, string? note)
        {
            var debitResult = GetById(debitId);
            if (!debitResult.Success || debitResult.Data == null)
                return new ErrorResult("Zimmet kaydı bulunamadı.");

            var debit = debitResult.Data;
            if (!string.Equals(debit.Status, DebitStatusTexts.Sent, StringComparison.OrdinalIgnoreCase))
                return new ErrorResult("Bu kayıt teslimat bekleyen statüde değil.");

            if (debit.ReceiverUserId != receiverUserId)
                return new ErrorResult("Bu zimmet kaydı için işlem yapma yetkiniz yok.");

            return FinalizeHandshakeFailure(debit, note, false);
        }

        [LoggerAspect]
        public IResult MarkDeliveryFailedByAdmin(int debitId, string? note)
        {
            var debitResult = GetById(debitId);
            if (!debitResult.Success || debitResult.Data == null)
                return new ErrorResult("Zimmet kaydı bulunamadı.");

            var debit = debitResult.Data;
            if (!string.Equals(debit.Status, DebitStatusTexts.Sent, StringComparison.OrdinalIgnoreCase))
                return new ErrorResult("Bu kayıt bekleyen gönderim statüsünde değil.");

            return FinalizeHandshakeFailure(debit, note, true);
        }

        /// <summary>Gönderildi → Teslim Edilemedi; stok iade (Add ile tutarlı). PDF üretilmez — doğrudan DB güncellemesi.</summary>
        private IResult FinalizeHandshakeFailure(Debit debit, string? note, bool fromAdmin)
        {
            var productResult = _productService.GetById(debit.ProductId);
            if (!productResult.Success || productResult.Data == null)
                return new ErrorResult("Ürün bulunamadı.");

            var product = productResult.Data;
            product.Quantity = product.Quantity + 1;
            product.Status = product.Quantity > 0 ? "Depoda" : "Zimmetli";
            if (product.CurrentDebitId == debit.Id)
                product.CurrentDebitId = 0;

            var updateProduct = _productService.Update(product);
            if (!updateProduct.Success)
                return updateProduct;

            var trimmed = string.IsNullOrWhiteSpace(note) ? null : note.Trim();
            if (!string.IsNullOrEmpty(trimmed))
            {
                debit.Description = string.IsNullOrWhiteSpace(debit.Description)
                    ? trimmed
                    : debit.Description + " | " + trimmed;
            }
            else if (fromAdmin)
            {
                const string adminTag = "Yönetici: Teslim edilemedi olarak işaretlendi.";
                debit.Description = string.IsNullOrWhiteSpace(debit.Description)
                    ? adminTag
                    : debit.Description + " | " + adminTag;
            }

            debit.Status = DebitStatusTexts.DeliveryFailed;
            debit.PdfFile = null;
            _debitDal.Update(debit);

            var failedHtml = DebitWorkflowMailTemplates.BuildDeliveryFailedHtml(
                fullName: _userDal.Get(u => u.Id == debit.ReceiverUserId)?.Name ?? "Kullanıcı",
                note: note,
                portalUrl: ResolvePortalUrl("/dashboard/my-assets"));
            TrySendMailToReceiver(debit.ReceiverUserId, subject: "Zimmet teslim edilemedi", body: failedHtml);

            return new SuccessResult("Kayıt teslim edilemedi olarak güncellendi.");
        }
    }
}