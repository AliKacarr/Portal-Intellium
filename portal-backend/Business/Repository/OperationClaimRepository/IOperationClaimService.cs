using Core.Utilities.Results.Abstract;
using Entities.Concrete;

namespace Business.Repository.OperationClaimRepository
{
    public interface IOperationClaimService
    {
        IResult Add(string operationClaimName);
        IResult Update(OperationClaim operationClaim);
        IResult Delete(OperationClaim operationClaim);
        IDataResult<List<OperationClaim>> GetAll();
        IDataResult<OperationClaim> GetById(long id);

    }
}
