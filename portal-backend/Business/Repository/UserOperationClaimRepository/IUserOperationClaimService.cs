using Core.Utilities.Results.Abstract;
using Entities.Concrete;
using Entities.DTOs.AuthDtos;

namespace Business.Repository.UserOperationClaimRepository
{
    public interface IUserOperationClaimService
    {
        IResult Add(UserOperationClaim userOperationClaim);
        IResult Delete(UserOperationClaim userOperationClaim);
        IResult Update(UserOperationClaim userOperationClaim);
        IDataResult<List<UserOperationClaim>> GetAll(long userId);
        IDataResult<List<UserOperationClaimDto>> GetListDto(long userId);
        IDataResult<UserOperationClaim> GetById(long id);
    }
}
