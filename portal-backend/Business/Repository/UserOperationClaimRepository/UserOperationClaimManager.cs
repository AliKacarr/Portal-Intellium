using Business.Repository.UserOperationClaimRepository.Constants;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.UserOperationClaimRepository;
using Entities.Concrete;
using Entities.DTOs.AuthDtos;

namespace Business.Repository.UserOperationClaimRepository
{
    public class UserOperationClaimManager : IUserOperationClaimService
    {
        private readonly IUserOperationClaimDal _userOperationClaimDal;

        public UserOperationClaimManager(IUserOperationClaimDal userOperationClaimDal)
        {
            _userOperationClaimDal = userOperationClaimDal;
        }
        
        public IResult Add(UserOperationClaim userOperationClaim)
        {
            _userOperationClaimDal.Add(userOperationClaim);
            return new SuccessResult(UserOperationClaimMessages.Added);
        }

        public IResult Delete(UserOperationClaim userOperationClaim)
        {
            _userOperationClaimDal.Delete(userOperationClaim);
            return new SuccessResult(UserOperationClaimMessages.Deleted);
        }

        public IDataResult<List<UserOperationClaim>> GetAll(long userId)
        {
            return new SuccessDataResult<List<UserOperationClaim>>(_userOperationClaimDal.GetAll(p => p.UserId == userId), UserOperationClaimMessages.Listed);
        }

        public IDataResult<UserOperationClaim> GetById(long id)
        {
            return new SuccessDataResult<UserOperationClaim>(_userOperationClaimDal.Get(i => i.Id == id), UserOperationClaimMessages.GetUserClaim);
        }

        public IDataResult<List<UserOperationClaimDto>> GetListDto(long userId)
        {
            return new SuccessDataResult<List<UserOperationClaimDto>>(_userOperationClaimDal.GetListDto(userId));
        }

        public IResult Update(UserOperationClaim userOperationClaim)
        {
            _userOperationClaimDal.Update(userOperationClaim);
            return new SuccessResult(UserOperationClaimMessages.Updated);
        }
    }
}
