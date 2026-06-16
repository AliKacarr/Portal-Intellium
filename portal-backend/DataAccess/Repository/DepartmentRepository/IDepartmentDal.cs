using Core.DataAccess;
using Entities.Concrete;
using Entities.DTOs.DepartmentDtos;

namespace DataAccess.Repository.DepartmentRepository
{
    public interface IDepartmentDal : IEntityRepository<Department>
    {
        List<GetDepartmentDto> GetAllAsDto();
        GetDepartmentDto GetByIdAsDto(long id);
    }
}
