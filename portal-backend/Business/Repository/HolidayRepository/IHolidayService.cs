using Core.Utilities.Results.Abstract;
using Entities.Concrete;
using System.Collections.Generic;

namespace Business.Repository.HolidayRepository
{
    public interface IHolidayService
    {
        IResult Add(Holiday holiday);
        IResult Update(Holiday holiday);
        IDataResult<List<Holiday>> GetAll();
        IResult Delete(int id);
        
        // --- YENİ EKLENEN METOD ---
        IResult GenerateHolidaysForYear(int year);
    }
}