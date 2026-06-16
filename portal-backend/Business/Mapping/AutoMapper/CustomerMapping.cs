using AutoMapper;
using Entities.Concrete;
using Entities.DTOs.CustomerDtos;

namespace Business.Mapping.AutoMapper
{
	public class CustomerMapping : Profile
	{
		public CustomerMapping()
		{
			CreateMap<Customer, BasicCustomerDto>();
		}
	}
}
