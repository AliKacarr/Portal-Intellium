using Business.BusinessAspects;
using Business.Repository.DepartmentRepository.Validations;
using Core.Aspects.Autofac.Validation;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.DepartmentRepository;
using Entities.Concrete;
using Entities.DTOs.DepartmentDtos;

namespace Business.Repository.DepartmentRepository
{
    public class DepartmentManager : IDepartmentService
    {
        private readonly IDepartmentDal _departmentDal;

        public DepartmentManager(IDepartmentDal departmentDal)
        {
            _departmentDal = departmentDal;
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.Admin},{RoleNames.Worker},{RoleNames.User},{RoleNames.WorkerOutsource},{RoleNames.WorkerOutsourced}")]
        public IDataResult<List<GetDepartmentDto>> GetAll()
        {
            return new SuccessDataResult<List<GetDepartmentDto>>(_departmentDal.GetAllAsDto());
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.Admin},{RoleNames.Worker},{RoleNames.User}")]
        public IDataResult<GetDepartmentDto> GetById(long id)
        {
            var dto = _departmentDal.GetByIdAsDto(id);
            if (dto == null)
                return new ErrorDataResult<GetDepartmentDto>("Departman bulunamadı.");
            return new SuccessDataResult<GetDepartmentDto>(dto);
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.Admin}")]
        [ValidationAspect(typeof(AddDepartmentDtoValidator))]
        public IResult Add(AddDepartmentDto dto)
        {
            var department = new Department
            {
                Name = dto.Name,
                Description = dto.Description,
                IsActive = true,
                CreatedAt = DateTime.Now
            };
            _departmentDal.Add(department);
            return new SuccessResult("Departman başarıyla oluşturuldu.");
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.Admin}")]
        [ValidationAspect(typeof(UpdateDepartmentDtoValidator))]
        public IResult Update(UpdateDepartmentDto dto)
        {
            var existing = _departmentDal.Get(d => d.Id == dto.Id && d.IsActive);
            if (existing == null)
                return new ErrorResult("Departman bulunamadı.");

            existing.Name = dto.Name;
            existing.Description = dto.Description;
            existing.UpdatedAt = DateTime.Now;
            _departmentDal.Update(existing);
            return new SuccessResult("Departman güncellendi.");
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.Admin}")]
        public IResult Delete(long id)
        {
            var existing = _departmentDal.Get(d => d.Id == id && d.IsActive);
            if (existing == null)
                return new ErrorResult("Departman bulunamadı.");

            existing.IsActive = false;
            existing.UpdatedAt = DateTime.Now;
            _departmentDal.Update(existing);
            return new SuccessResult("Departman silindi.");
        }
    }
}
