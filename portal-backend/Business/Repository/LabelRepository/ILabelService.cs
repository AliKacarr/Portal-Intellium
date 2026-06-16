using Core.Utilities.Results.Abstract;
using Entities.Concrete;

namespace Business.Repository.LabelRepository
{
    public interface ILabelService
    {
        IResult Add(Label label);
        IResult Delete(int labelId);
        IResult Update(Label label);
        IDataResult<List<Label>> GetAll();

    }
}
