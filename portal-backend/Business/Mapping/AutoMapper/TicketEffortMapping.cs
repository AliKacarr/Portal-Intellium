using AutoMapper;
using Entities.Concrete;
using Entities.DTOs.TicketEffortDtos;

namespace Business.Mapping.AutoMapper
{
    public class TicketEffortMapping : Profile
    {
        public TicketEffortMapping()
        {
            CreateMap<TicketEffort, GetTicketEffortDto>().ReverseMap();
            CreateMap<TicketEffort, AddTicketEffortDto>().ReverseMap();
        }
    }
}
