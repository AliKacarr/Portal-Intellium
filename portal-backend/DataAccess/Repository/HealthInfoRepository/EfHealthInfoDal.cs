using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;
using Entities.DTOs.HealthInfoDtos;
using Entities.DTOs.UserDtos;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;

namespace DataAccess.Repository.HealthInfoRepository
{
    public class EfHealthInfoDal : EfEntityRepositoryBase<HealthInfo, PortalContext>, IHealthInfoDal
    {
        public List<GetHealthInfoWithUserDto> GetAllWithUser()
        {
            using var context = new PortalContext();

            var result = context.HealthInfos
                .Include(hi => hi.User)
                .Include(hi => hi.HealthInfoPremium)
                .Include(hi => hi.HealthInfoDependents)
                .Include(hi => hi.HealthInfoDocuments)
                .Select(entity => new GetHealthInfoWithUserDto
                {
                    Id = entity.Id,
                    User = new BaseUserDto
                    {
                        Id = entity.User.Id,
                        Name = entity.User.Name,
                        ImageUrl = entity.User.ImageUrl,
                        IsActive = entity.User.IsActive
                    },
                    InsuranceCompanyName = entity.InsuranceCompanyName,
                    InsurancePolicyNo = entity.InsurancePolicyNo,
                    InsuranceBeginDate = entity.InsuranceBeginDate,
                    InsuranceEndDate = entity.InsuranceEndDate,
                    IsActive = entity.IsActive,
                    AddedAt = entity.AddedAt,
                    PolicyType = entity.PolicyType,
                    PolicyStatus = entity.PolicyStatus,
                    PlanName = entity.PlanName,
                    CoverageArea = entity.CoverageArea,
                    CoverageLimit = entity.CoverageLimit,
                    CoveragePercentage = entity.CoveragePercentage,

                    // --- YENİ EKLENENLER ---
                    AgencyName = entity.AgencyName,
                    AgencyContactPerson = entity.AgencyContactPerson,
                    AgencyContactPhone = entity.AgencyContactPhone,
                    // -----------------------

                    PremiumDetails = entity.HealthInfoPremium == null ? null : new HealthInfoPremiumDto
                    {
                        TotalPremium = entity.HealthInfoPremium.TotalPremium,
                        EmployerContribution = entity.HealthInfoPremium.EmployerContribution,
                        EmployeeContribution = entity.HealthInfoPremium.EmployeeContribution,
                        MonthlyDeduction = entity.HealthInfoPremium.MonthlyDeduction,
                        TaxAdvantageInfo = entity.HealthInfoPremium.TaxAdvantageInfo,
                        PaymentType = entity.HealthInfoPremium.PaymentType,
                        InstallmentDetails = entity.HealthInfoPremium.InstallmentDetails
                    },
                    Dependents = entity.HealthInfoDependents.Select(d => new HealthInfoDependentDto
                    {
                        Id = d.Id,
                        DependentName = d.DependentName,
                        Relationship = d.Relationship,
                        CoverageStatus = d.CoverageStatus,
                        PlanDetails = d.PlanDetails
                    }).ToList(),
                    Documents = entity.HealthInfoDocuments.Select(doc => new HealthInfoDocumentDto
                    {
                        Id = doc.Id,
                        DocumentType = doc.DocumentType,
                        FilePath = doc.FilePath,
                        UploadedAt = doc.UploadedAt
                    }).ToList()
                })
                .ToList();

            return result;
        }

        public GetHealthInfoWithUserDto? GetWithUserById(long id)
        {
            using var context = new PortalContext();
            
            var result = context.HealthInfos
                .Where(h => h.Id == id)
                .Include(hi => hi.User)
                .Include(hi => hi.HealthInfoPremium)
                .Include(hi => hi.HealthInfoDependents)
                .Include(hi => hi.HealthInfoDocuments)
                .Select(entity => new GetHealthInfoWithUserDto
                {
                    Id = entity.Id,
                    User = new BaseUserDto
                    {
                        Id = entity.User.Id,
                        Name = entity.User.Name,
                        ImageUrl = entity.User.ImageUrl,
                        IsActive = entity.User.IsActive
                    },
                    InsuranceCompanyName = entity.InsuranceCompanyName,
                    InsurancePolicyNo = entity.InsurancePolicyNo,
                    InsuranceBeginDate = entity.InsuranceBeginDate,
                    InsuranceEndDate = entity.InsuranceEndDate,
                    IsActive = entity.IsActive,
                    AddedAt = entity.AddedAt,
                    PolicyType = entity.PolicyType,
                    PolicyStatus = entity.PolicyStatus,
                    PlanName = entity.PlanName,
                    CoverageArea = entity.CoverageArea,
                    CoverageLimit = entity.CoverageLimit,
                    CoveragePercentage = entity.CoveragePercentage,

                    // --- YENİ EKLENENLER ---
                    AgencyName = entity.AgencyName,
                    AgencyContactPerson = entity.AgencyContactPerson,
                    AgencyContactPhone = entity.AgencyContactPhone,
                    // -----------------------

                    PremiumDetails = entity.HealthInfoPremium == null ? null : new HealthInfoPremiumDto
                    {
                        TotalPremium = entity.HealthInfoPremium.TotalPremium,
                        EmployerContribution = entity.HealthInfoPremium.EmployerContribution,
                        EmployeeContribution = entity.HealthInfoPremium.EmployeeContribution,
                        MonthlyDeduction = entity.HealthInfoPremium.MonthlyDeduction,
                        TaxAdvantageInfo = entity.HealthInfoPremium.TaxAdvantageInfo,
                        PaymentType = entity.HealthInfoPremium.PaymentType,
                        InstallmentDetails = entity.HealthInfoPremium.InstallmentDetails
                    },
                    Dependents = entity.HealthInfoDependents.Select(d => new HealthInfoDependentDto
                    {
                        Id = d.Id,
                        DependentName = d.DependentName,
                        Relationship = d.Relationship,
                        CoverageStatus = d.CoverageStatus,
                        PlanDetails = d.PlanDetails
                    }).ToList(),
                    Documents = entity.HealthInfoDocuments.Select(doc => new HealthInfoDocumentDto
                    {
                        Id = doc.Id,
                        DocumentType = doc.DocumentType,
                        FilePath = doc.FilePath,
                        UploadedAt = doc.UploadedAt
                    }).ToList()
                })
                .FirstOrDefault();

            return result;
        }
    }
}