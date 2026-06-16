using AutoMapper;
using Entities.Concrete;
using Entities.DTOs.UserDetailDtos;

namespace Business.Mapping.AutoMapper
{
	public class UserProfileMapping : Profile
	{
		public UserProfileMapping()
		{
			CreateMap<UserProfileDetails, BasicGeneralUserDetailDto>().ReverseMap();
		}
	}
}
