using Core.Utilities.Results.Abstract;
using Entities.DTOs.PermissionTypeDtos;

namespace Business.Repository.PermissionTypeRepository
{
    public interface IPermissionTypeService
    {
        IResult Add(AddPermissionTypeDto addPermissionTypeDto);
        IResult Update(UpdatePermissionTypeDto updatePermissionTypeDto);
        IResult Delete(int id);
        IDataResult<List<PermissionTypeDto>> GetAll();
        IDataResult<PermissionTypeDto> GetById(int id);
    }
}
