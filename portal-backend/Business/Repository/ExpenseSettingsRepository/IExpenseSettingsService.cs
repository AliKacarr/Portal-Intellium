using Core.Utilities.Results.Abstract;
using Entities.DTOs.ExpenseSettingsDto;

namespace Business.Repository.ExpenseSettingsRepository
{
    public interface IExpenseSettingsService
    {
        IDataResult<ExpenseSettingsResponseDto> Get();
        IResult Update(UpdateExpenseSettingsDto dto);
    }
}
