using System.Globalization;
using System.Text.Json;
using Business.BusinessAspects;
using Business.File;
using Business.Helpers;
using Business.Repository.CvUserImportRepository.Constants;
using Core.Identity;
using Core.Utilities.Hashing;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;
using Entities.DTOs.CvUserImportDtos;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using IResult = Core.Utilities.Results.Abstract.IResult;

namespace Business.Repository.CvUserImportRepository
{
    public class CvUserImportManager : ICvUserImportService
    {
        private const string CvImportFileType = "cv-imports";
        private static readonly TimeSpan ProcessingTimeout = TimeSpan.FromMinutes(20);
        private static readonly SemaphoreSlim ProcessingLock = new(1, 1);
        private readonly PortalContext _db;
        private readonly IFileService _fileService;
        private readonly ICvParserClient _cvParserClient;
        private readonly IUserContext _userContext;
        private readonly IHostingEnvironment _hostingEnvironment;
        private readonly JsonSerializerOptions _jsonOptions = new()
        {
            PropertyNameCaseInsensitive = true,
        };

        public CvUserImportManager(
            PortalContext db,
            IFileService fileService,
            ICvParserClient cvParserClient,
            IUserContext userContext,
            IHostingEnvironment hostingEnvironment)
        {
            _db = db;
            _fileService = fileService;
            _cvParserClient = cvParserClient;
            _userContext = userContext;
            _hostingEnvironment = hostingEnvironment;
        }

        [LoggerAspect]
        [SecuredOperation(RoleNames.Admin)]
        public async Task<IDataResult<CvUserImportBatchDto>> UploadAsync(IFormFileCollection files)
        {
            if (files == null || files.Count == 0)
                return new ErrorDataResult<CvUserImportBatchDto>(CvUserImportMessages.EmptyFileList);

            var now = DateTime.UtcNow;
            var batch = new CvUserImportBatch
            {
                CreatedByUserId = _userContext.UserId,
                CreatedAt = now,
                Status = CvUserImportStatuses.Pending,
                TotalCount = files.Count,
                ProcessedCount = 0,
                FailedCount = 0,
            };

            _db.CvUserImportBatches.Add(batch);
            await _db.SaveChangesAsync();

            for (var index = 0; index < files.Count; index++)
            {
                var file = files[index];
                var saveResult = await _fileService.Save(file, CvImportFileType);
                if (!saveResult.Success)
                {
                    _db.CvUserImportItems.Add(new CvUserImportItem
                    {
                        BatchId = batch.Id,
                        SortOrder = index,
                        FileName = file.FileName,
                        FilePath = string.Empty,
                        ContentType = file.ContentType ?? "application/octet-stream",
                        FileSize = file.Length,
                        Status = CvUserImportStatuses.Failed,
                        ErrorMessage = saveResult.Message ?? "Dosya kaydedilemedi.",
                        CreatedAt = now,
                        CompletedAt = DateTime.UtcNow,
                    });
                    continue;
                }

                _db.CvUserImportItems.Add(new CvUserImportItem
                {
                    BatchId = batch.Id,
                    SortOrder = index,
                    FileName = file.FileName,
                    FilePath = saveResult.Data.FilePath,
                    ContentType = file.ContentType ?? "application/octet-stream",
                    FileSize = file.Length,
                    Status = CvUserImportStatuses.Pending,
                    CreatedAt = now,
                });
            }

            await _db.SaveChangesAsync();
            UpdateBatchCounters(batch.Id);

            return new SuccessDataResult<CvUserImportBatchDto>(MapBatch(batch.Id), CvUserImportMessages.Imported);
        }

        [LoggerAspect]
        [SecuredOperation(RoleNames.Admin)]
        public IDataResult<CvUserImportBatchDto> GetBatch(long batchId)
        {
            var batch = MapBatch(batchId);
            return batch == null
                ? new ErrorDataResult<CvUserImportBatchDto>(CvUserImportMessages.BatchNotFound)
                : new SuccessDataResult<CvUserImportBatchDto>(batch);
        }

        [LoggerAspect]
        [SecuredOperation(RoleNames.Admin)]
        public IDataResult<List<CvUserImportItemDto>> GetMine()
        {
            var batchIds = _db.CvUserImportBatches
                .Where(b => b.CreatedByUserId == _userContext.UserId)
                .Select(b => b.Id)
                .ToList();

            var items = _db.CvUserImportItems
                .Where(i =>
                    batchIds.Contains(i.BatchId)
                    && i.Status != CvUserImportStatuses.Deleted
                    && i.Status != CvUserImportStatuses.Applied)
                .Join(
                    _db.CvUserImportBatches,
                    item => item.BatchId,
                    batch => batch.Id,
                    (item, batch) => new { item, batch })
                .OrderBy(import => import.batch.CreatedAt)
                .ThenBy(import => import.batch.Id)
                .ThenBy(import => import.item.SortOrder)
                .ThenBy(import => import.item.Id)
                .Select(import => import.item)
                .ToList();

            return new SuccessDataResult<List<CvUserImportItemDto>>(items.Select(MapItem).ToList());
        }

        public async Task<IDataResult<bool>> ProcessNextPendingAsync(CancellationToken cancellationToken)
        {
            if (!await ProcessingLock.WaitAsync(0, cancellationToken))
                return new SuccessDataResult<bool>(false);

            try
            {
                await ReleaseStaleProcessingItemsAsync(cancellationToken);

                if (await _db.CvUserImportItems.AnyAsync(i => i.Status == CvUserImportStatuses.Processing, cancellationToken))
                    return new SuccessDataResult<bool>(false);

                var item = await _db.CvUserImportItems
                    .Where(i => i.Status == CvUserImportStatuses.Pending)
                    .Join(
                        _db.CvUserImportBatches,
                        item => item.BatchId,
                        batch => batch.Id,
                        (item, batch) => new { item, batch })
                    .OrderBy(import => import.batch.CreatedAt)
                    .ThenBy(import => import.batch.Id)
                    .ThenBy(import => import.item.SortOrder)
                    .ThenBy(import => import.item.Id)
                    .Select(import => import.item)
                    .FirstOrDefaultAsync(cancellationToken);

                if (item == null)
                    return new SuccessDataResult<bool>(false);

                item.Status = CvUserImportStatuses.Processing;
                item.StartedAt = DateTime.UtcNow;
                item.ErrorMessage = null;
                await _db.SaveChangesAsync(cancellationToken);
                UpdateBatchCounters(item.BatchId);

                try
                {
                    var absoluteFilePath = Path.Combine(_hostingEnvironment.ContentRootPath, "file-storage", item.FilePath);
                    var candidate = await _cvParserClient.ParseAsync(
                        absoluteFilePath,
                        item.FileName,
                        item.ContentType,
                        cancellationToken);

                    var normalizedCandidate = NormalizeCandidate(candidate);
                    await _db.Entry(item).ReloadAsync(cancellationToken);
                    if (item.Status == CvUserImportStatuses.Deleted)
                    {
                        UpdateBatchCounters(item.BatchId);
                        return new SuccessDataResult<bool>(true);
                    }

                    item.ExtractedJson = JsonSerializer.Serialize(normalizedCandidate, _jsonOptions);
                    item.Status = CvUserImportStatuses.Completed;
                    item.CompletedAt = DateTime.UtcNow;
                    item.ErrorMessage = null;
                }
                catch (Exception ex)
                {
                    await _db.Entry(item).ReloadAsync(cancellationToken);
                    if (item.Status == CvUserImportStatuses.Deleted)
                    {
                        UpdateBatchCounters(item.BatchId);
                        return new SuccessDataResult<bool>(true);
                    }

                    item.Status = CvUserImportStatuses.Failed;
                    item.CompletedAt = DateTime.UtcNow;
                    item.ErrorMessage = ex.Message;
                }

                await _db.SaveChangesAsync(cancellationToken);
                UpdateBatchCounters(item.BatchId);
                return new SuccessDataResult<bool>(true);
            }
            finally
            {
                ProcessingLock.Release();
            }
        }

        private async System.Threading.Tasks.Task ReleaseStaleProcessingItemsAsync(CancellationToken cancellationToken)
        {
            var cutoff = DateTime.UtcNow.Subtract(ProcessingTimeout);
            var staleItems = await _db.CvUserImportItems
                .Where(i =>
                    i.Status == CvUserImportStatuses.Processing
                    && (!i.StartedAt.HasValue || i.StartedAt.Value < cutoff))
                .ToListAsync(cancellationToken);

            if (!staleItems.Any())
                return;

            foreach (var staleItem in staleItems)
            {
                staleItem.Status = CvUserImportStatuses.Failed;
                staleItem.CompletedAt = DateTime.UtcNow;
                staleItem.ErrorMessage = "CV analizi zaman aşımına uğradı. Dosyayı silip tekrar yükleyebilirsiniz.";
            }

            await _db.SaveChangesAsync(cancellationToken);

            foreach (var batchId in staleItems.Select(i => i.BatchId).Distinct())
                UpdateBatchCounters(batchId);
        }

        [LoggerAspect]
        [SecuredOperation(RoleNames.Admin)]
        public async Task<IDataResult<CreateUsersFromCvImportResultDto>> CreateUsersAsync(CreateUsersFromCvImportDto createUsersDto)
        {
            if (createUsersDto?.Candidates == null || !createUsersDto.Candidates.Any())
                return new ErrorDataResult<CreateUsersFromCvImportResultDto>(CvUserImportMessages.NoCandidateSelected);

            var result = new CreateUsersFromCvImportResultDto();

            foreach (var selectedCandidate in createUsersDto.Candidates)
            {
                var item = selectedCandidate.ItemId.HasValue
                    ? await _db.CvUserImportItems.FirstOrDefaultAsync(i => i.Id == selectedCandidate.ItemId.Value)
                    : null;

                try
                {
                    var candidate = NormalizeCandidate(MergeWithStoredCandidate(item, selectedCandidate.Candidate));
                    var validationError = ValidateCandidate(candidate);
                    if (validationError != null)
                    {
                        result.Failures.Add(new CvUserImportFailureDto
                        {
                            ItemId = selectedCandidate.ItemId,
                            FileName = item?.FileName,
                            Message = validationError,
                        });
                        continue;
                    }

                    var email = candidate.Account.Email!.Trim().ToLowerInvariant();
                    if (await _db.Users.AnyAsync(u => u.Email.ToLower() == email))
                    {
                        result.Failures.Add(new CvUserImportFailureDto
                        {
                            ItemId = selectedCandidate.ItemId,
                            FileName = item?.FileName,
                            Message = "Bu e-posta ile kayıtlı kullanıcı zaten var.",
                        });
                        continue;
                    }

                    await using var transaction = await _db.Database.BeginTransactionAsync();
                    var user = CreateUser(candidate);
                    _db.Users.Add(user);
                    await _db.SaveChangesAsync();

                    _db.UserCustomers.Add(new UserCustomer
                    {
                        UserId = user.Id,
                        CustomerId = candidate.Account.Customer!.Value,
                    });

                    _db.RolesForUsers.Add(new RolesForUsers
                    {
                        UserId = user.Id,
                        RoleId = candidate.Account.UserRole!.Value,
                    });

                    _db.UserPermissions.Add(CreateUserPermission(user));
                    _db.UserProfileDetails.Add(CreateProfile(user.Id, candidate));
                    AddCvDetails(user.Id, candidate);

                    if (item != null)
                    {
                        item.Status = CvUserImportStatuses.Applied;
                        item.CreatedUserId = user.Id;
                        item.ExtractedJson = JsonSerializer.Serialize(candidate, _jsonOptions);
                    }

                    await _db.SaveChangesAsync();
                    await transaction.CommitAsync();

                    result.CreatedCount++;
                    result.CreatedUsers.Add(new CreatedCvUserDto
                    {
                        UserId = user.Id,
                        ItemId = selectedCandidate.ItemId,
                        Name = user.Name,
                        Email = user.Email,
                    });

                    if (item != null)
                        UpdateBatchCounters(item.BatchId);
                }
                catch (Exception ex)
                {
                    result.Failures.Add(new CvUserImportFailureDto
                    {
                        ItemId = selectedCandidate.ItemId,
                        FileName = item?.FileName,
                        Message = ex.Message,
                    });
                }
            }

            if (result.CreatedCount == 0 && result.Failures.Any())
                return new ErrorDataResult<CreateUsersFromCvImportResultDto>(result, result.Failures.First().Message);

            return new SuccessDataResult<CreateUsersFromCvImportResultDto>(result, CvUserImportMessages.UsersCreated);
        }

        [LoggerAspect]
        [SecuredOperation(RoleNames.Admin)]
        public IResult DeleteItems(DeleteCvUserImportItemsDto deleteItemsDto)
        {
            if (deleteItemsDto?.ItemIds == null || !deleteItemsDto.ItemIds.Any())
                return new ErrorResult("Silinecek CV kartı bulunamadı.");

            var items = _db.CvUserImportItems
                .Where(i => deleteItemsDto.ItemIds.Contains(i.Id))
                .ToList();

            foreach (var item in items)
            {
                if (item.Status == CvUserImportStatuses.Applied)
                    continue;

                item.Status = CvUserImportStatuses.Deleted;
                item.CompletedAt = DateTime.UtcNow;

                if (!string.IsNullOrWhiteSpace(item.FilePath))
                    _fileService.Delete(item.FilePath, CvImportFileType);
            }

            _db.SaveChanges();

            foreach (var batchId in items.Select(i => i.BatchId).Distinct())
                UpdateBatchCounters(batchId);

            return new SuccessResult(CvUserImportMessages.ItemsDeleted);
        }

        private CvUserImportBatchDto? MapBatch(long batchId)
        {
            var batch = _db.CvUserImportBatches.FirstOrDefault(b => b.Id == batchId);
            if (batch == null)
                return null;

            var items = _db.CvUserImportItems
                .Where(i => i.BatchId == batchId && i.Status != CvUserImportStatuses.Deleted)
                .OrderBy(i => i.SortOrder)
                .ToList();

            return new CvUserImportBatchDto
            {
                Id = batch.Id,
                Status = batch.Status,
                TotalCount = batch.TotalCount,
                ProcessedCount = batch.ProcessedCount,
                FailedCount = batch.FailedCount,
                CreatedAt = batch.CreatedAt,
                Items = items.Select(MapItem).ToList(),
            };
        }

        private CvUserImportItemDto MapItem(CvUserImportItem item)
        {
            return new CvUserImportItemDto
            {
                Id = item.Id,
                BatchId = item.BatchId,
                SortOrder = item.SortOrder,
                FileName = item.FileName,
                Status = item.Status,
                ErrorMessage = item.ErrorMessage,
                Candidate = DeserializeCandidate(item.ExtractedJson),
                CreatedAt = item.CreatedAt,
                StartedAt = item.StartedAt,
                CompletedAt = item.CompletedAt,
                CreatedUserId = item.CreatedUserId,
            };
        }

        private CvCandidateDto? DeserializeCandidate(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
                return null;

            try
            {
                return JsonSerializer.Deserialize<CvCandidateDto>(json, _jsonOptions);
            }
            catch
            {
                return null;
            }
        }

        private CvCandidateDto MergeWithStoredCandidate(CvUserImportItem? item, CvCandidateDto? selectedCandidate)
        {
            var candidate = selectedCandidate ?? new CvCandidateDto();
            if (item == null)
                return candidate;

            var storedCandidate = DeserializeCandidate(item.ExtractedJson);
            if (storedCandidate == null)
                return candidate;

            candidate.Account ??= storedCandidate.Account;
            candidate.Profile ??= storedCandidate.Profile;

            if (candidate.Skills == null || !candidate.Skills.Any())
                candidate.Skills = storedCandidate.Skills ?? new List<string>();

            if (candidate.JobExperiences == null || !candidate.JobExperiences.Any())
                candidate.JobExperiences = storedCandidate.JobExperiences ?? new List<CvCandidateJobExperienceDto>();

            if (candidate.Educations == null || !candidate.Educations.Any())
                candidate.Educations = storedCandidate.Educations ?? new List<CvCandidateEducationDto>();

            if (candidate.Languages == null || !candidate.Languages.Any())
                candidate.Languages = storedCandidate.Languages ?? new List<CvCandidateLanguageDto>();

            if (candidate.Certificates == null || !candidate.Certificates.Any())
                candidate.Certificates = storedCandidate.Certificates ?? new List<CvCandidateCertificateDto>();

            return candidate;
        }

        private void UpdateBatchCounters(long batchId)
        {
            var batch = _db.CvUserImportBatches.FirstOrDefault(b => b.Id == batchId);
            if (batch == null)
                return;

            var items = _db.CvUserImportItems
                .Where(i => i.BatchId == batchId && i.Status != CvUserImportStatuses.Deleted)
                .ToList();

            batch.TotalCount = items.Count;
            batch.ProcessedCount = items.Count(i => i.Status == CvUserImportStatuses.Completed || i.Status == CvUserImportStatuses.Applied);
            batch.FailedCount = items.Count(i => i.Status == CvUserImportStatuses.Failed);

            if (!items.Any())
                batch.Status = CvUserImportStatuses.Deleted;
            else if (items.Any(i => i.Status == CvUserImportStatuses.Processing))
                batch.Status = CvUserImportStatuses.Processing;
            else if (items.Any(i => i.Status == CvUserImportStatuses.Pending))
                batch.Status = CvUserImportStatuses.Pending;
            else
                batch.Status = CvUserImportStatuses.Completed;

            _db.SaveChanges();
        }

        private CvCandidateDto NormalizeCandidate(CvCandidateDto candidate)
        {
            candidate ??= new CvCandidateDto();
            candidate.Account ??= new CvCandidateAccountDto();
            candidate.Profile ??= new CvCandidateProfileDto();
            candidate.Skills ??= new List<string>();
            candidate.JobExperiences ??= new List<CvCandidateJobExperienceDto>();
            candidate.Educations ??= new List<CvCandidateEducationDto>();
            candidate.Languages ??= new List<CvCandidateLanguageDto>();
            candidate.Certificates ??= new List<CvCandidateCertificateDto>();

            candidate.Account.Username = Clean(candidate.Account.Username);
            candidate.Account.Email = Clean(candidate.Account.Email)?.ToLowerInvariant();
            candidate.Account.Language = Clean(candidate.Account.Language) ?? "Türkçe";
            candidate.Account.CurrentTitle = Clean(candidate.Account.CurrentTitle);
            candidate.Account.Timezone = Clean(candidate.Account.Timezone) ?? "Europe/Istanbul";
            candidate.Account.IsActive ??= true;

            if (!candidate.Account.UserRole.HasValue || !_db.UserRoles.Any(r => r.Id == candidate.Account.UserRole.Value))
                candidate.Account.UserRole = GetDefaultUserRoleId();

            if (!candidate.Account.Customer.HasValue || !_db.Customers.Any(c => c.CustomerId == candidate.Account.Customer.Value))
                candidate.Account.Customer = _db.Customers.OrderBy(c => c.CustomerId).Select(c => (long?)c.CustomerId).FirstOrDefault();

            var nameParts = SplitName(candidate.Account.Username);
            candidate.Profile.Name = Clean(candidate.Profile.Name) ?? nameParts.name;
            candidate.Profile.Surname = Clean(candidate.Profile.Surname) ?? nameParts.surname;
            candidate.Profile.Adress = Clean(candidate.Profile.Adress);
            candidate.Profile.Country = Clean(candidate.Profile.Country);
            candidate.Profile.Province = Clean(candidate.Profile.Province);
            candidate.Profile.District = Clean(candidate.Profile.District);
            candidate.Profile.TelNo =
                Clean(candidate.Profile.TelNo)
                ?? Clean(candidate.Profile.PhoneNumber)
                ?? Clean(candidate.Profile.Phone)
                ?? Clean(candidate.Profile.Telefon);
            candidate.Profile.GithubUrl = Clean(candidate.Profile.GithubUrl);
            candidate.Profile.LinkedInUrl = Clean(candidate.Profile.LinkedInUrl);
            candidate.Skills = candidate.Skills.Where(s => !string.IsNullOrWhiteSpace(s)).Select(s => s.Trim()).Distinct().ToList();
            candidate.JobExperiences = candidate.JobExperiences.Where(i => i != null).Select(NormalizeExperience).ToList();
            candidate.Educations = candidate.Educations.Where(i => i != null).Select(NormalizeEducation).ToList();
            candidate.Languages = candidate.Languages.Where(i => i != null).Select(NormalizeLanguage).ToList();
            candidate.Certificates = candidate.Certificates.Where(i => i != null).Select(NormalizeCertificate).ToList();

            return candidate;
        }

        private long? GetDefaultUserRoleId()
        {
            var defaultRoleNames = new[] { "user", "kullanıcı", "kullanici" };
            var roles = _db.UserRoles.OrderBy(r => r.Id).ToList();
            return roles
                .FirstOrDefault(role =>
                    defaultRoleNames.Contains((role.RoleName ?? string.Empty).Trim().ToLowerInvariant()))?.Id
                ?? roles.Select(role => (long?)role.Id).FirstOrDefault();
        }

        private static CvCandidateJobExperienceDto NormalizeExperience(CvCandidateJobExperienceDto experience)
        {
            experience.CompanyName = Clean(experience.CompanyName);
            experience.JobTitle = Clean(experience.JobTitle);
            experience.Duty = Clean(experience.Duty);
            experience.StartDate = Clean(experience.StartDate);
            experience.DepartureDate = Clean(experience.DepartureDate);
            return experience;
        }

        private static CvCandidateEducationDto NormalizeEducation(CvCandidateEducationDto education)
        {
            education.CompletedEducation = Clean(education.CompletedEducation);
            education.School = Clean(education.School);
            education.Department = Clean(education.Department);
            education.Scholarship = Clean(education.Scholarship);
            education.GradePoint = Clean(education.GradePoint);
            education.StartDate = Clean(education.StartDate);
            education.EndDate = Clean(education.EndDate);
            return education;
        }

        private static CvCandidateLanguageDto NormalizeLanguage(CvCandidateLanguageDto language)
        {
            language.ForeignLanguage = Clean(language.ForeignLanguage);
            language.Read = Clean(language.Read);
            language.Write = Clean(language.Write);
            language.Speaking = Clean(language.Speaking);
            language.DocumentPath = Clean(language.DocumentPath);
            return language;
        }

        private static CvCandidateCertificateDto NormalizeCertificate(CvCandidateCertificateDto certificate)
        {
            certificate.CertificateName = Clean(certificate.CertificateName);
            certificate.CertificateNo = Clean(certificate.CertificateNo);
            certificate.InstitutionName = Clean(certificate.InstitutionName);
            certificate.StartTime = Clean(certificate.StartTime);
            certificate.EndTime = Clean(certificate.EndTime);
            certificate.CertificateExamMark = Clean(certificate.CertificateExamMark);
            return certificate;
        }

        private string? ValidateCandidate(CvCandidateDto candidate)
        {
            if (candidate.Account.Username.IsNullOrEmpty())
                return "Kullanıcı adı soyadı zorunlu.";

            if (candidate.Account.Email.IsNullOrEmpty())
                return "E-posta zorunlu.";

            if (candidate.Account.Password.IsNullOrEmpty())
                return "Kullanıcı şifresi zorunlu.";

            if (!candidate.Account.Customer.HasValue)
                return "Şirket seçimi zorunlu.";

            if (!candidate.Account.UserRole.HasValue)
                return "Kullanıcı rolü zorunlu.";

            return null;
        }

        private User CreateUser(CvCandidateDto candidate)
        {
            HashingHelper.CreatePasswordHash(candidate.Account.Password!, out var passwordHash, out var passwordSalt);
            return new User
            {
                Language = candidate.Account.Language ?? "Türkçe",
                Email = candidate.Account.Email!.Trim().ToLowerInvariant(),
                AddetAt = DateTime.UtcNow,
                BirthDate = new DateTime(2000, 1, 1),
                IsConfirm = true,
                MailConfirm = false,
                IsActive = candidate.Account.IsActive ?? true,
                MailConfirmDate = DateTime.UtcNow,
                ConfirmValue = Guid.NewGuid().ToString(),
                PasswordHash = passwordHash,
                PasswordSalt = passwordSalt,
                Name = candidate.Account.Username!.Trim(),
            };
        }

        private UserPermission CreateUserPermission(User user)
        {
            var leave = UserPermissionCalculate.CalculateTotalLeave(user.AddetAt, user.BirthDate);
            return new UserPermission
            {
                UserId = user.Id,
                TotalLeave = leave,
                RemainingLeave = leave,
                UsedLeave = 0,
                ThisYear = leave,
                Year = DateTime.Now.Year,
            };
        }

        private UserProfileDetails CreateProfile(long userId, CvCandidateDto candidate)
        {
            return new UserProfileDetails
            {
                UserId = userId,
                Name = candidate.Profile.Name ?? Empty(),
                Surname = candidate.Profile.Surname ?? Empty(),
                PreferredName = Empty(),
                BirthDate = new DateTime(2000, 1, 1),
                BirthPlace = Empty(),
                Sex = Empty(),
                MilitaryCase = Empty(),
                MilitaryDate = null,
                BankAccountNo = Empty(),
                BankName = Empty(),
                IBANNo = Empty(),
                Condition = Empty(),
                HandicappedState = Empty(),
                TC = Empty(),
                Nationality = Empty(),
                BloodType = Empty(),
                Country = candidate.Profile.Country ?? Empty(),
                Province = candidate.Profile.Province ?? Empty(),
                District = candidate.Profile.District ?? Empty(),
                PostCode = Empty(),
                Adress = candidate.Profile.Adress ?? Empty(),
                TelNo = candidate.Profile.TelNo ?? Empty(),
                HomePhone = null,
                Interphone = null,
                OtherEmail = null,
                Office = null,
                GithubUrl = candidate.Profile.GithubUrl,
                LinkedInUrl = candidate.Profile.LinkedInUrl,
            };
        }

        private void AddCvDetails(long userId, CvCandidateDto candidate)
        {
            foreach (var experience in candidate.JobExperiences.Where(HasExperienceValue))
            {
                _db.UserJobExperiences.Add(new UserJobExperience
                {
                    UserId = userId,
                    CompanyName = experience.CompanyName ?? Empty(),
                    JobTitle = experience.JobTitle ?? Empty(),
                    Duty = experience.Duty ?? Empty(),
                    StartDate = ParseDate(experience.StartDate) ?? new DateTime(1900, 1, 1),
                    DepartureDate = ParseDate(experience.DepartureDate),
                });
            }

            foreach (var education in candidate.Educations.Where(HasEducationValue))
            {
                _db.UserEducationDetails.Add(new UserEducationDetail
                {
                    UserId = userId,
                    CompletedEducation = education.CompletedEducation ?? Empty(),
                    School = education.School ?? Empty(),
                    Department = education.Department ?? Empty(),
                    Scholarship = education.Scholarship ?? Empty(),
                    GradePoint = ParseDouble(education.GradePoint),
                    StartDate = ParseDate(education.StartDate) ?? new DateTime(1900, 1, 1),
                    EndDate = ParseDate(education.EndDate),
                });
            }

            foreach (var language in candidate.Languages.Where(HasLanguageValue))
            {
                _db.UserLanguageDetails.Add(new UserLanguageDetail
                {
                    UserId = userId,
                    ForeignLanguage = language.ForeignLanguage ?? Empty(),
                    Read = language.Read ?? Empty(),
                    Write = language.Write ?? Empty(),
                    Speaking = language.Speaking ?? Empty(),
                    DocumentPath = language.DocumentPath,
                });
            }

            foreach (var certificate in candidate.Certificates.Where(HasCertificateValue))
            {
                var startDate = ParseDate(certificate.StartTime) ?? new DateTime(1900, 1, 1);
                _db.UserCertificateDetails.Add(new UserCertificateDetail
                {
                    UserId = userId,
                    CertificateName = certificate.CertificateName ?? Empty(),
                    CertificateNo = certificate.CertificateNo ?? Empty(),
                    InstitutionName = certificate.InstitutionName ?? Empty(),
                    StartTime = startDate,
                    EndTime = ParseDate(certificate.EndTime) ?? startDate,
                    CertificateExamMark = ParseDouble(certificate.CertificateExamMark),
                });
            }
        }

        private static bool HasExperienceValue(CvCandidateJobExperienceDto item)
        {
            return !string.IsNullOrWhiteSpace(item.CompanyName)
                || !string.IsNullOrWhiteSpace(item.JobTitle)
                || !string.IsNullOrWhiteSpace(item.Duty);
        }

        private static bool HasEducationValue(CvCandidateEducationDto item)
        {
            return !string.IsNullOrWhiteSpace(item.School)
                || !string.IsNullOrWhiteSpace(item.Department)
                || !string.IsNullOrWhiteSpace(item.CompletedEducation);
        }

        private static bool HasLanguageValue(CvCandidateLanguageDto item)
        {
            return !string.IsNullOrWhiteSpace(item.ForeignLanguage);
        }

        private static bool HasCertificateValue(CvCandidateCertificateDto item)
        {
            return !string.IsNullOrWhiteSpace(item.CertificateName)
                || !string.IsNullOrWhiteSpace(item.InstitutionName);
        }

        private static (string? name, string? surname) SplitName(string? fullName)
        {
            if (string.IsNullOrWhiteSpace(fullName))
                return (null, null);

            var parts = fullName.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 1)
                return (parts[0], null);

            return (string.Join(" ", parts.Take(parts.Length - 1)), parts.Last());
        }

        private static DateTime? ParseDate(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return null;

            var formats = new[] { "dd.MM.yyyy", "d.M.yyyy", "yyyy-MM-dd", "MM.yyyy", "yyyy" };
            foreach (var format in formats)
            {
                if (DateTime.TryParseExact(value.Trim(), format, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed))
                    return parsed;
            }

            return DateTime.TryParse(value, CultureInfo.GetCultureInfo("tr-TR"), DateTimeStyles.None, out var fallback)
                ? fallback
                : null;
        }

        private static double ParseDouble(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return 0;

            var normalized = value.Trim().Replace(',', '.');
            return double.TryParse(normalized, NumberStyles.Any, CultureInfo.InvariantCulture, out var parsed)
                ? parsed
                : 0;
        }

        private static string? Clean(string? value)
        {
            return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        }

        private static string Empty()
        {
            return string.Empty;
        }
    }
}
