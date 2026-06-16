using Business.BusinessAspects;
using Business.Repository.ExpenseSettingsRepository.Constants;
using Business.Repository.ExpenseSettingsRepository.Validations;
using Core.Aspects.Autofac.Validation;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.ExpenseSettingsRepository;
using Entities.Concrete;
using Entities.DTOs.ExpenseSettingsDto;
using Newtonsoft.Json;

namespace Business.Repository.ExpenseSettingsRepository
{
    public class ExpenseSettingsManager : IExpenseSettingsService
    {
        private readonly IExpenseSettingsDal _expenseSettingsDal;

        public ExpenseSettingsManager(IExpenseSettingsDal expenseSettingsDal)
        {
            _expenseSettingsDal = expenseSettingsDal;
        }

        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        public IDataResult<ExpenseSettingsResponseDto> Get()
        {
            try
            {
                var settings = _expenseSettingsDal.Get(s => s.Id == 1);
                if (settings == null)
                    return new SuccessDataResult<ExpenseSettingsResponseDto>(GetDefaultDto(), ExpenseSettingsMessages.SettingsListed);

                var vatRates = ParseVatRates(settings.VatRatesJson);
                var dto = new ExpenseSettingsResponseDto
                {
                    MealAcceptedDailyAmount = settings.MealAcceptedDailyAmount,
                    PreviousPeriodCutoffDay = settings.PreviousPeriodCutoffDay,
                    VatRates = vatRates
                };
                return new SuccessDataResult<ExpenseSettingsResponseDto>(dto, ExpenseSettingsMessages.SettingsListed);
            }
            catch
            {
                // Tablo yok veya erişim hatası - varsayılan değerlerle 200 dön, asla 500 verme
                return new SuccessDataResult<ExpenseSettingsResponseDto>(GetDefaultDto(), ExpenseSettingsMessages.SettingsListed);
            }
        }

        private static ExpenseSettingsResponseDto GetDefaultDto()
        {
            return new ExpenseSettingsResponseDto
            {
                MealAcceptedDailyAmount = 500,
                PreviousPeriodCutoffDay = 5,
                VatRates = new List<int> { 1, 10, 20 }
            };
        }

        [ValidationAspect(typeof(UpdateExpenseSettingsDtoValidator))]
        [SecuredOperation(RoleNames.Admin)]
        public IResult Update(UpdateExpenseSettingsDto dto)
        {
            try
            {
                var settings = _expenseSettingsDal.Get(s => s.Id == 1);
                if (settings == null)
                {
                    settings = new ExpenseSettings
                    {
                        Id = 1,
                        MealAcceptedDailyAmount = dto.MealAcceptedDailyAmount,
                        PreviousPeriodCutoffDay = dto.PreviousPeriodCutoffDay,
                        VatRatesJson = JsonConvert.SerializeObject(dto.VatRates ?? new List<int>())
                    };
                    _expenseSettingsDal.Add(settings);
                }
                else
                {
                    settings.MealAcceptedDailyAmount = dto.MealAcceptedDailyAmount;
                    settings.PreviousPeriodCutoffDay = dto.PreviousPeriodCutoffDay;
                    settings.VatRatesJson = JsonConvert.SerializeObject(dto.VatRates ?? new List<int>());
                    _expenseSettingsDal.Update(settings);
                }
                return new SuccessResult(ExpenseSettingsMessages.SettingsUpdated);
            }
            catch (Exception)
            {
                return new ErrorResult(ExpenseSettingsMessages.SettingsNotFound);
            }
        }

        private static List<int> ParseVatRates(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
                return new List<int> { 1, 10, 20 };
            try
            {
                var list = JsonConvert.DeserializeObject<List<int>>(json);
                return list ?? new List<int> { 1, 10, 20 };
            }
            catch
            {
                return new List<int> { 1, 10, 20 };
            }
        }
    }
}
