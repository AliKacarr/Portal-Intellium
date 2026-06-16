using AutoMapper;
using Entities.Concrete;
using Entities.DTOs.ProjectDtos;

namespace Business.Mapping.AutoMapper
{
	public class ProjectMapping : Profile
	{
		public ProjectMapping()
		{
			CreateMap<Project, AddProjectDto>().ReverseMap();
			CreateMap<Project, UpdateProjectDto>().ReverseMap();
		}
	}
}
