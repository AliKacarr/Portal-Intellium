using Business.Repository.OperationClaimRepository.Constants;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.OperationClaimRepository;
using Entities.Concrete;

namespace Business.Repository.OperationClaimRepository
{
	public class OperationClaimManager : IOperationClaimService
	{
		private readonly IOperationClaimDal _operationClaimDal;

		public OperationClaimManager(IOperationClaimDal operationClaimDal)
		{
			_operationClaimDal = operationClaimDal;
		}

		public IResult Add(string operationClaimName)
		{
			_operationClaimDal.Add(new()
			{
				Name = operationClaimName,
			});
			return new SuccessResult(OperationClaimMessages.Added);
		}

		public IResult Delete(OperationClaim operationClaim)
		{
			_operationClaimDal.Delete(operationClaim);
			return new SuccessResult(OperationClaimMessages.Deleted);
		}

		public IDataResult<List<OperationClaim>> GetAll()
		{
			return new SuccessDataResult<List<OperationClaim>>(_operationClaimDal.GetAll(), OperationClaimMessages.Listed);
		}

		public IDataResult<OperationClaim> GetById(long id)
		{
			return new SuccessDataResult<OperationClaim>(_operationClaimDal.Get(x => x.Id == id));
		}

		public IResult Update(OperationClaim operationClaim)
		{
			_operationClaimDal.Update(operationClaim);
			return new SuccessResult(OperationClaimMessages.Updated);
		}
	}
}
