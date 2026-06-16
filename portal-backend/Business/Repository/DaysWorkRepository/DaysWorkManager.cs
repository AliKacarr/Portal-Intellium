using Business.Helpers;
using Business.Repository.CustomRepository;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.DaysWorkRepository;
using DataAccess.Repository.PermissionRepository;
using DataAccess.Repository.UserRepository;
using Entities.Concrete;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Business.Repository.DaysWorkRepository
{
    public class DaysWorkManager : IDaysWorkService
    {
        private readonly IDaysWorkDal _daysWorkDal;
        private readonly IUserDal _userDal;
        private readonly IPermissionDal _permissionDal;
        public DaysWorkManager(IDaysWorkDal daysworkDal, IUserDal userDal, IPermissionDal permissionDal)
        {
            _daysWorkDal = daysworkDal;
            _userDal = userDal;
            _permissionDal = permissionDal;
        }
        public IResult Add(DaysWork dayswork)
        {
            _daysWorkDal.Add(dayswork);
            return new SuccessResult(DaysWorkMessages.AddedDaysWork);
        }

        public IResult ExportToExcel()
        {
            var users = _userDal.GetAll();
            var daysWorks = _daysWorkDal.GetAll();
            var permissions = _permissionDal.GetAll();
            
            DaysWorkExportToExcel daysWorkExportToExcel = new();
            daysWorkExportToExcel.ExportToExcel(users,daysWorks,permissions);
            return new SuccessResult("Success");
        }

        public IResult Delete(int id)
        {
            var dayswork = _daysWorkDal.Get(x => x.Id == id);
            if (dayswork == null)
            {
                return new ErrorResult(DaysWorkMessages.NotFound);
            }
            _daysWorkDal.Delete(dayswork);
            return new SuccessResult(DaysWorkMessages.DeletedDaysWork);
        }

        public IDataResult<List<DaysWork>> GetAll()
        {
            return new SuccessDataResult<List<DaysWork>>(_daysWorkDal.GetAll());
        }

        public IDataResult<List<DaysWork>> GetByUserId(int userId)
        {
            return new SuccessDataResult<List<DaysWork>>(_daysWorkDal.GetDaysWorkByUserId(userId));
        }

        public IResult Update(DaysWork dayswork)
        {
            _daysWorkDal.Update(dayswork);
            return new SuccessResult(DaysWorkMessages.UpdatedDaysWork);
        }

        public IDataResult<List<DaysWork>> GetByMonth(int month, int year)
        {
 
            return new SuccessDataResult<List<DaysWork>>(_daysWorkDal.GetByMonth(month , year));


        }

        public IResult ExportToExcelByMonth(int month, int year)
        {
            var users = _userDal.GetAll();
            var daysWorks = _daysWorkDal.GetByMonth(month, year);
            var permissions = _permissionDal.GetAll();

            DaysWorkExportToExcel daysWorkExportToExcel = new();
            daysWorkExportToExcel.ExportToExcel(users, daysWorks, permissions , month, year);
            return new SuccessResult("Success");

        }
    }
}
