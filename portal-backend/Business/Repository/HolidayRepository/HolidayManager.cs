using Business.Helpers; // HolidayCalculator için
using Business.Repository.HolidayRepository.Constans;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.HolidayRepository;
using Entities.Concrete;
using System.Collections.Generic;
using System.Linq;

namespace Business.Repository.HolidayRepository
{
    public class HolidayManager : IHolidayService
    {
        private readonly IHolidayDal _holidayDal;

        public HolidayManager(IHolidayDal holidayDal)
        {
            _holidayDal = holidayDal;
        }

        public IResult Add(Holiday holiday)
        {
            _holidayDal.Add(holiday);
            return new SuccessResult(HolidayMessages.AddedHoliday);
        }

        public IResult Delete(int id)
        {
            var holiday = _holidayDal.Get(x => x.Id.Equals(id));
            if (holiday != null)
            {
                _holidayDal.Delete(holiday);
                return new SuccessResult(HolidayMessages.DeletedPermission);
            }
            return new ErrorResult("Tatil bulunamadı.");
        }

        public IDataResult<List<Holiday>> GetAll()
        {
            return new SuccessDataResult<List<Holiday>>(_holidayDal.GetAll());
        }

        public IResult Update(Holiday holiday)
        {
            _holidayDal.Update(holiday);
            return new SuccessResult(HolidayMessages.UpdatedPermission);
        }

        // --- YENİ METOD: OTOMATİK OLUŞTURUCU ---
        public IResult GenerateHolidaysForYear(int year)
        {
            // 1. Helper sınıfından o yılın olması gereken tatillerini al
            var holidaysToGenerate = HolidayCalculator.GetHolidaysForYear(year);
            
            // 2. Veritabanındaki o yıla ait mevcut tatilleri çek
            var existingHolidays = _holidayDal.GetAll(h => h.StartTime.Year == year);

            int addedCount = 0;

            foreach (var holiday in holidaysToGenerate)
            {
                // Çakışma Kontrolü:
                // Aynı İSİMDE ve aynı BAŞLANGIÇ TARİHİNDE (Gün/Ay/Yıl) kayıt var mı?
                bool exists = existingHolidays.Any(existing => 
                    existing.Name == holiday.Name && 
                    existing.StartTime.Date == holiday.StartTime.Date
                );

                // Yoksa ekle
                if (!exists)
                {
                    _holidayDal.Add(holiday);
                    addedCount++;
                }
            }

            if (addedCount == 0)
            {
                return new SuccessResult($"{year} yılı için tüm tatiller zaten sistemde mevcut.");
            }

            return new SuccessResult($"{year} yılı için {addedCount} adet yeni tatil başarıyla oluşturuldu.");
        }
    }
}