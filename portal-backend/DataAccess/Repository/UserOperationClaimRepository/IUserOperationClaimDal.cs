using Core.DataAccess;
using Entities.Concrete;
using Entities.DTOs.AuthDtos;

namespace DataAccess.Repository.UserOperationClaimRepository
{
    public interface IUserOperationClaimDal : IEntityRepository<UserOperationClaim>
    {
        List<UserOperationClaimDto> GetListDto(long userId);
    }
}
