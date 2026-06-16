using Core.Utilities.Results.Abstract;
using Entities.DTOs.ExpenseCategoryDto;

namespace Business.Repository.ExpenseCategoryRepository
{
    public interface IExpenseCategoryService
    {
        IDataResult<List<ExpenseCategoryResponseDto>> GetAll();
        IResult Add(AddExpenseCategoryDto dto);
        IResult Update(int id, UpdateExpenseCategoryDto dto);
        IResult Delete(int id);
    }
}
