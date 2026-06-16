using AutoMapper;
using Entities.Concrete;
using Entities.DTOs.TicketDtos;

namespace Business.Mapping.AutoMapper
{
	public class TicketMapping : Profile
	{
		public TicketMapping()
		{
			CreateMap<Ticket, PublishTicketDto>().ReverseMap();
		}
	}
}
