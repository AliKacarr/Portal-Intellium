using AutoMapper;
using Business.Repository.PermissionTypeRepository;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.PermissionTypeRepository;
using Entities.Concrete;
using Entities.DTOs.PermissionTypeDtos;
using Entities.Enums;

namespace Business.Repository.PermissionTypeRepository
{
    public class PermissionTypeManager : IPermissionTypeService
    {
        private readonly IPermissionTypeDal _permissionTypeDal;
        private readonly IMapper _mapper;

        public PermissionTypeManager(IPermissionTypeDal permissionTypeDal, IMapper mapper)
        {
            _permissionTypeDal = permissionTypeDal;
            _mapper = mapper;
        }

        public IResult Add(AddPermissionTypeDto addPermissionTypeDto)
        {
            var validate = ValidateDurationFields(addPermissionTypeDto.DurationUnit, addPermissionTypeDto.MinDuration, addPermissionTypeDto.MaxDuration);
            if (!validate.Success) return validate;

            var permissionType = _mapper.Map<PermissionTypes>(addPermissionTypeDto);
            _permissionTypeDal.Add(permissionType);
            return new SuccessResult("İzin parametresi başarıyla eklendi.");
        }

        public IResult Delete(int id)
        {
            var permissionType = _permissionTypeDal.Get(p => p.Id == id);
            if (permissionType == null)
            {
                return new ErrorResult("İzin parametresi bulunamadı.");
            }

            // Gelişmiş silme mimarisi: EntityFramework Core ForeignKey olan durumlarda hata atabilir
            // Bunu try-catch ile veya interceptor ile de ele alabiliriz. Biz Exception Middleware'a bırakıyoruz.
            _permissionTypeDal.Delete(permissionType);
            return new SuccessResult("İzin parametresi başarıyla silindi.");
        }

        public IDataResult<List<PermissionTypeDto>> GetAll()
        {
            var permissionTypes = _permissionTypeDal.GetAll();
            var dtos = _mapper.Map<List<PermissionTypeDto>>(permissionTypes);
            return new SuccessDataResult<List<PermissionTypeDto>>(dtos, "İzin parametreleri başarıyla listelendi.");
        }

        public IDataResult<PermissionTypeDto> GetById(int id)
        {
            var permissionType = _permissionTypeDal.Get(p => p.Id == id);
            if (permissionType == null)
            {
                return new ErrorDataResult<PermissionTypeDto>(null, "İzin parametresi bulunamadı.");
            }

            var dto = _mapper.Map<PermissionTypeDto>(permissionType);
            return new SuccessDataResult<PermissionTypeDto>(dto, "İzin parametresi başarıyla getirildi.");
        }

        public IResult Update(UpdatePermissionTypeDto updatePermissionTypeDto)
        {
            var existingParam = _permissionTypeDal.Get(p => p.Id == updatePermissionTypeDto.Id);
            if (existingParam == null)
            {
                return new ErrorResult("İzin parametresi bulunamadı.");
            }

            var validate = ValidateDurationFields(updatePermissionTypeDto.DurationUnit, updatePermissionTypeDto.MinDuration, updatePermissionTypeDto.MaxDuration);
            if (!validate.Success) return validate;

            _mapper.Map(updatePermissionTypeDto, existingParam);
            _permissionTypeDal.Update(existingParam);

            return new SuccessResult("İzin parametresi başarıyla güncellendi.");
        }

        private static IResult ValidateDurationFields(short durationUnit, decimal? minDuration, decimal? maxDuration)
        {
            if (durationUnit != (short)PermissionDurationUnit.Day && durationUnit != (short)PermissionDurationUnit.Hour)
                return new ErrorResult("Süre birimi 1 (gün) veya 2 (saat) olmalıdır.");

            if (minDuration.HasValue && maxDuration.HasValue && minDuration.Value > maxDuration.Value)
                return new ErrorResult("Minimum süre, maksimum süreden büyük olamaz.");

            if (minDuration.HasValue && minDuration.Value < 0)
                return new ErrorResult("Minimum süre negatif olamaz.");

            if (maxDuration.HasValue && maxDuration.Value <= 0)
                return new ErrorResult("Maksimum süre sıfırdan büyük olmalıdır.");

            return new SuccessResult();
        }
    }
}
