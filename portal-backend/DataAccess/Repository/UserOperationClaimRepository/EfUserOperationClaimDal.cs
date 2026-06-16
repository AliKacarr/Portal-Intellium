using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;
using Entities.DTOs.AuthDtos;

namespace DataAccess.Repository.UserOperationClaimRepository
{
    public class EfUserOperationClaimDal : EfEntityRepositoryBase<UserOperationClaim, PortalContext>, IUserOperationClaimDal
    {
        public List<UserOperationClaimDto> GetListDto(long userId)
        {
            using (var context = new PortalContext())
            {
                var result = from userOperationClaim in context.UserOperationClaims.Where(x => x.UserId == userId)
                             join operationClaim in context.OperationClaims
                             on userOperationClaim.OperationClaimId equals operationClaim.Id
                             select new UserOperationClaimDto
                             {
                                 UserId = userId,
                                 Id = operationClaim.Id,
                                 OperationClaimId = operationClaim.Id,
                                 OperationName = operationClaim.Name
                             };
                return result.ToList();
            }
        }
    }
}
