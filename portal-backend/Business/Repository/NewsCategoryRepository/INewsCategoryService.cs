using Core.Utilities.Results.Abstract;
using Entities.Concrete;

namespace Business.Repository.NewsCategoryRepository
{
    public interface INewsCategoryService
    {
        IDataResult<List<NewsCategory>> GetAll();
        IDataResult<NewsCategory> GetById(long id);
        IResult Add(string name, string? description);
        IResult Update(long id, string name, string? description);
        IResult Delete(long id);
    }
}
