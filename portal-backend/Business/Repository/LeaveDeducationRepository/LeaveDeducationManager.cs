using Business.Repository.LeaveDeducationRepository.Constans;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.LeaveDeducationRepository;
using Entities.Concrete;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Business.Repository.LeaveDeducationRepository
{
    public class LeaveDeducationManager : ILeaveDeducationService
    {
        private readonly ILeaveDeducationDal _leaveDeducationDal;

        public LeaveDeducationManager(ILeaveDeducationDal leaveDeducationDal)
        {
            _leaveDeducationDal = leaveDeducationDal;
        }

        public IResult Add(LeaveDeducation leaveDeducation)
        {
            _leaveDeducationDal.Add(leaveDeducation);
            return new SuccessResult(LeaveDeducationMessages.AddedDeducation);
        }

        public IResult Delete(int id)
        {
            var leaveDeducation = _leaveDeducationDal.Get(x=> x.Id == id);
            _leaveDeducationDal.Delete(leaveDeducation);
            return new SuccessResult(LeaveDeducationMessages.DeletedDeducation);
        }

        public IDataResult<List<LeaveDeducation>> GetAll()
        {
            return new SuccessDataResult<List<LeaveDeducation>>(_leaveDeducationDal.GetAll());
        }

        public IResult GetByPermissionType(string permissionType)
        {
            return new SuccessDataResult<LeaveDeducation>(_leaveDeducationDal.GetByPermissionType(permissionType));
        }

        public IResult Update(LeaveDeducation leaveDeducation)
        {
            _leaveDeducationDal.Update(leaveDeducation);
            return new SuccessResult(LeaveDeducationMessages.UpdatedDeducation);
        }
    }
}
