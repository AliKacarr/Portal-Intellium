using Core.Utilities.Results.Abstract;
using Entities.DTOs.DepartmentDtos;

namespace Business.Repository.DepartmentRepository
{
    public interface IDepartmentService
    {
        IDataResult<List<GetDepartmentDto>> GetAll();
        IDataResult<GetDepartmentDto> GetById(long id);
        IResult Add(AddDepartmentDto dto);
        IResult Update(UpdateDepartmentDto dto);
        IResult Delete(long id);
    }
}
