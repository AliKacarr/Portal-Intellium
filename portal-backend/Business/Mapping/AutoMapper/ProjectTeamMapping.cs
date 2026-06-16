using AutoMapper;
using Entities.Concrete;
using Entities.DTOs.ProjectTeamDtos;

namespace Business.Mapping.AutoMapper
{
	public class ProjectTeamMapping : Profile
	{
		public ProjectTeamMapping()
		{
			CreateMap<ProjectTeam, AddProjectTeamDto>().ReverseMap();
			CreateMap<ProjectTeam, EditProjectTeamDto>().ReverseMap();
		}
	}
}
