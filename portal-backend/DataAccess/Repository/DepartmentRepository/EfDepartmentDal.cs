using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;
using Entities.DTOs.DepartmentDtos;

namespace DataAccess.Repository.DepartmentRepository
{
    public class EfDepartmentDal : EfEntityRepositoryBase<Department, PortalContext>, IDepartmentDal
    {
        public List<GetDepartmentDto> GetAllAsDto()
        {
            using var context = new PortalContext();
            return context.Departments
                .Where(d => d.IsActive)
                .OrderBy(d => d.Name)
                .Select(d => new GetDepartmentDto
                {
                    Id = d.Id,
                    Name = d.Name,
                    Description = d.Description,
                    IsActive = d.IsActive,
                    CreatedAt = d.CreatedAt
                })
                .ToList();
        }

        public GetDepartmentDto GetByIdAsDto(long id)
        {
            using var context = new PortalContext();
            return context.Departments
                .Where(d => d.Id == id && d.IsActive)
                .Select(d => new GetDepartmentDto
                {
                    Id = d.Id,
                    Name = d.Name,
                    Description = d.Description,
                    IsActive = d.IsActive,
                    CreatedAt = d.CreatedAt
                })
                .FirstOrDefault();
        }
    }
}
