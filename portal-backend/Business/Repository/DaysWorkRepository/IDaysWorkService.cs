using Core.Utilities.Results.Abstract;
using Entities.Concrete;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Business.Repository.DaysWorkRepository
{
    public interface IDaysWorkService
    {
        IResult Add(DaysWork dayswork);
        IResult Update(DaysWork dayswork);
        IDataResult<List<DaysWork>> GetAll();
        IResult Delete(int id);

        IDataResult<List<DaysWork>> GetByUserId(int userId);

        IResult ExportToExcel();
        IDataResult<List<DaysWork>> GetByMonth(int month , int year);
        IResult ExportToExcelByMonth(int month , int year);
    }
}
