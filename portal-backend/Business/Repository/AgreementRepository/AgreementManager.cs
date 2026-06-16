using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.AgreementRepository;
using DataAccess.Repository.UserAgreementRepository;
using Entities.Concrete;
using Entities.DTOs.AgreementDtos;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Business.Repository.AgreementRepository
{
    public class AgreementManager : IAgreementService
    {
        private readonly IAgreementDal _agreementDal;
        private readonly IUserAgreementDal _userAgreementDal;

        public AgreementManager(IAgreementDal agreementDal, IUserAgreementDal userAgreementDal)
        {
            _agreementDal = agreementDal;
            _userAgreementDal = userAgreementDal;
        }

        public IDataResult<List<AgreementDto>> GetActive()
        {
            var agreements = _agreementDal
                .GetAll(a => a.IsActive)
                .OrderBy(a => a.Type)
                .Select(MapAgreement)
                .ToList();

            return new SuccessDataResult<List<AgreementDto>>(agreements);
        }

        public IDataResult<List<AgreementDto>> GetHistory()
        {
            var agreements = _agreementDal
                .GetAll()
                .OrderBy(a => a.Type)
                .ThenByDescending(a => a.Version)
                .Select(MapAgreement)
                .ToList();

            return new SuccessDataResult<List<AgreementDto>>(agreements);
        }

        public IDataResult<AgreementDto> AddVersion(CreateAgreementDto agreementDto)
        {
            if (!Enum.IsDefined(typeof(AgreementType), agreementDto.Type))
            {
                return new ErrorDataResult<AgreementDto>("Geçersiz sözleşme tipi.");
            }

            if (string.IsNullOrWhiteSpace(agreementDto.Content))
            {
                return new ErrorDataResult<AgreementDto>("Sözleşme metni boş olamaz.");
            }

            var type = (AgreementType)agreementDto.Type;
            var sameTypeAgreements = _agreementDal.GetAll(a => a.Type == type);
            var latestVersion = sameTypeAgreements.Any() ? sameTypeAgreements.Max(a => a.Version) : 0;

            foreach (var activeAgreement in sameTypeAgreements.Where(a => a.IsActive))
            {
                activeAgreement.IsActive = false;
                _agreementDal.Update(activeAgreement);
            }

            var newAgreement = new Agreement
            {
                Type = type,
                Content = agreementDto.Content.Trim(),
                Version = latestVersion + 1,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _agreementDal.Add(newAgreement);
            return new SuccessDataResult<AgreementDto>(MapAgreement(newAgreement), "Yeni sözleşme versiyonu oluşturuldu.");
        }

        public IResult AcceptActiveAgreements(long userId, List<long> agreementIds, bool requireAllActive = false)
        {
            var activeAgreementIds = _agreementDal
                .GetAll(a => a.IsActive)
                .Select(a => a.Id)
                .ToList();

            if (!activeAgreementIds.Any())
            {
                return new SuccessResult("Aktif sözleşme bulunmadığı için onay kaydı gerekmedi.");
            }

            var requestedAgreementIds = agreementIds?.Distinct().ToList() ?? new List<long>();
            if (!requestedAgreementIds.Any())
            {
                return new ErrorResult("Onaylanacak sözleşme bulunamadı.");
            }

            if (requestedAgreementIds.Any(id => !activeAgreementIds.Contains(id)))
            {
                return new ErrorResult("Yalnızca güncel sözleşme versiyonları onaylanabilir.");
            }

            if (requireAllActive && activeAgreementIds.Any(id => !requestedAgreementIds.Contains(id)))
            {
                return new ErrorResult("Güncel KVKK ve açık rıza metinlerinin tamamı onaylanmalıdır.");
            }

            var acceptedAgreementIds = _userAgreementDal
                .GetAll(ua => ua.UserId == userId)
                .Select(ua => ua.AgreementId)
                .ToHashSet();

            var acceptedAt = DateTime.UtcNow;
            foreach (var agreementId in requestedAgreementIds.Where(id => !acceptedAgreementIds.Contains(id)))
            {
                _userAgreementDal.Add(new UserAgreement
                {
                    UserId = userId,
                    AgreementId = agreementId,
                    AcceptedAt = acceptedAt
                });
            }

            return new SuccessResult("Sözleşme onayları kaydedildi.");
        }

        public IDataResult<bool> RequiresAgreementUpdate(long userId)
        {
            var requiredAgreementIds = GetRequiredAgreementIds(userId).Data;
            return new SuccessDataResult<bool>(requiredAgreementIds.Any());
        }

        public IDataResult<List<long>> GetRequiredAgreementIds(long userId)
        {
            var activeAgreementIds = _agreementDal
                .GetAll(a => a.IsActive)
                .Select(a => a.Id)
                .ToList();

            if (!activeAgreementIds.Any())
            {
                return new SuccessDataResult<List<long>>(new List<long>());
            }

            var acceptedAgreementIds = _userAgreementDal
                .GetAll(ua => ua.UserId == userId)
                .Select(ua => ua.AgreementId)
                .ToHashSet();

            var requiredAgreementIds = activeAgreementIds
                .Where(id => !acceptedAgreementIds.Contains(id))
                .ToList();

            return new SuccessDataResult<List<long>>(requiredAgreementIds);
        }

        private static AgreementDto MapAgreement(Agreement agreement)
        {
            return new AgreementDto
            {
                Id = agreement.Id,
                Type = (int)agreement.Type,
                TypeName = agreement.Type.ToString(),
                Content = agreement.Content,
                Version = agreement.Version,
                IsActive = agreement.IsActive,
                CreatedAt = ToTurkeyTime(agreement.CreatedAt)
            };
        }

        private static DateTime ToTurkeyTime(DateTime value)
        {
            var utcValue = DateTime.SpecifyKind(value, DateTimeKind.Utc);
            try
            {
                return DateTime.SpecifyKind(
                    TimeZoneInfo.ConvertTimeFromUtc(utcValue, TimeZoneInfo.FindSystemTimeZoneById("Turkey Standard Time")),
                    DateTimeKind.Unspecified);
            }
            catch (TimeZoneNotFoundException)
            {
                return DateTime.SpecifyKind(
                    TimeZoneInfo.ConvertTimeFromUtc(utcValue, TimeZoneInfo.FindSystemTimeZoneById("Europe/Istanbul")),
                    DateTimeKind.Unspecified);
            }
        }
    }
}
