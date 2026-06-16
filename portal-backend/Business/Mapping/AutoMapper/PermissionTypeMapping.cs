using AutoMapper;
using Entities.Concrete;
using Entities.DTOs.PermissionTypeDtos;

namespace Business.Mapping.AutoMapper
{
    public class PermissionTypeMapping : Profile
    {
        public PermissionTypeMapping()
        {
            CreateMap<PermissionTypes, PermissionTypeDto>().ReverseMap();
            CreateMap<PermissionTypes, AddPermissionTypeDto>().ReverseMap();
            CreateMap<PermissionTypes, UpdatePermissionTypeDto>().ReverseMap();
        }
    }
}
