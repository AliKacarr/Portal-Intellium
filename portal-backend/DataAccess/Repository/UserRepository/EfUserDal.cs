using System.Linq;
using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;
using Entities.DTOs.CustomerDtos;
using Entities.DTOs.UserDtos;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Repository.UserRepository
{
    public class EfUserDal : EfEntityRepositoryBase<User, PortalContext>, IUserDal
    {
        public List<UserDto> GetAllForUserList()
        {
            using var context = new PortalContext();

            var users = (
                from user in context.Users.AsNoTracking()
                select new UserDto
                {
                    Id = user.Id,
                    Name = user.Name,
                    Email = user.Email,
                    Language = user.Language,
                    IsActive = user.IsActive,
                    AddetAt = user.AddetAt,
                    LegalConsentAcceptedAt = user.LegalConsentAcceptedAt,
                    ImageUrl = user.ImageUrl,
                    Customer = context.UserCustomers.Where(uc => uc.UserId.Equals(user.Id))
                        .OrderBy(uc => uc.CustomerId)
                        .Join(context.Customers, uc => uc.CustomerId, customer => customer.CustomerId, (uc, customer) => new BasicCustomerDto
                        {
                            CustomerId = customer.CustomerId,
                            CustomerName = customer.CustomerName,
                        }).FirstOrDefault(),
                    UserRole = context.RolesForUsers.Where(ru => ru.UserId.Equals(user.Id))
                        .OrderBy(ru => ru.RoleId)
                        .Join(context.UserRoles, ru => ru.RoleId, role => role.Id, (ru, role) => new UserRole
                        {
                            Id = role.Id,
                            RoleName = role.RoleName,
                        }).FirstOrDefault(),
                }).OrderBy(user => user.Id).ToList();

            ApplyLatestAgreementAcceptances(context, users);
            return users;
        }

        public UserDto GetUserAsDtoById(long id)
        {
            using var context = new PortalContext();

            var user = (
                from u in context.Users.AsNoTracking()
                where u.Id == id
                select new UserDto
                {
                    Id = u.Id,
                    Name = u.Name,
                    Email = u.Email,
                    Language = u.Language,
                    IsActive = u.IsActive,
                    AddetAt = u.AddetAt,
                    LegalConsentAcceptedAt = u.LegalConsentAcceptedAt,
                    ImageUrl = u.ImageUrl,
                    Customer = context.UserCustomers.Where(uc => uc.UserId.Equals(u.Id))
                        .OrderBy(uc => uc.CustomerId)
                        .Join(context.Customers, uc => uc.CustomerId, customer => customer.CustomerId, (uc, customer) => new BasicCustomerDto
                        {
                            CustomerId = customer.CustomerId,
                            CustomerName = customer.CustomerName,
                        }).FirstOrDefault(),
                    UserRole = context.RolesForUsers.Where(ru => ru.UserId.Equals(u.Id))
                        .OrderBy(ru => ru.RoleId)
                        .Join(context.UserRoles, ru => ru.RoleId, role => role.Id, (ru, role) => new UserRole
                        {
                            Id = role.Id,
                            RoleName = role.RoleName,
                        }).FirstOrDefault(),
                }).SingleOrDefault();

            if (user == null)
                return null!;

            ApplyLatestAgreementAcceptances(context, new List<UserDto> { user });
            return user;
        }

        public List<UserDto> GetByName(string name)
        {
            using (var context = new PortalContext())
            {
                var result = from user in context.Users
                             where user.Name.ToLower().Contains(name.ToLower())
                             select new UserDto
                             {
                                 Id = user.Id,
                                 Name = user.Name,
                                 Email = user.Email,
                                 ImageUrl = user.ImageUrl

                             };
                return result.ToList();
            }
        }

        public List<OperationClaim> GetClaims(User user, long customerId)
        {
            using var context = new PortalContext();
            var result = from operationClaim in context.OperationClaims
                         join userOperationClaim in context.UserOperationClaims
                         on operationClaim.Id equals userOperationClaim.OperationClaimId
                         where userOperationClaim.UserId == user.Id
                         select new OperationClaim
                         {
                             Id = operationClaim.Id,
                             Name = operationClaim.Name,
                             AddedAt = operationClaim.AddedAt

                         };
            return result.OrderBy(p => p.Name).ToList();

        }

        private static void ApplyLatestAgreementAcceptances(PortalContext context, List<UserDto> users)
        {
            if (users.Count == 0)
                return;

            var userIds = users.Select(u => u.Id).ToHashSet();

            var agreementAcceptances = context.UserAgreements
                .AsNoTracking()
                .Include(ua => ua.Agreement)
                .Where(ua => userIds.Contains(ua.UserId))
                .Select(ua => new
                {
                    ua.UserId,
                    ua.AcceptedAt,
                    ua.Agreement.Type,
                    ua.Agreement.Version
                })
                .ToList();

            var kvkkByUser = agreementAcceptances
                .Where(a => a.Type == AgreementType.KVKK)
                .GroupBy(a => a.UserId)
                .ToDictionary(
                    g => g.Key,
                    g =>
                    {
                        var latest = g.OrderByDescending(a => a.Version).First();
                        return (latest.AcceptedAt, latest.Version);
                    });

            var consentByUser = agreementAcceptances
                .Where(a => a.Type == AgreementType.AcikRiza)
                .GroupBy(a => a.UserId)
                .ToDictionary(
                    g => g.Key,
                    g =>
                    {
                        var latest = g.OrderByDescending(a => a.Version).First();
                        return (latest.AcceptedAt, latest.Version);
                    });

            foreach (var user in users)
            {
                if (kvkkByUser.TryGetValue(user.Id, out var kvkk))
                {
                    user.KvkkAcceptedAt = kvkk.AcceptedAt;
                    user.KvkkVersion = kvkk.Version;
                }

                if (consentByUser.TryGetValue(user.Id, out var consent))
                {
                    user.ExplicitConsentAcceptedAt = consent.AcceptedAt;
                    user.ExplicitConsentVersion = consent.Version;
                }
            }
        }
    }
}
