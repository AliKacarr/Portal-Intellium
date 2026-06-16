using AutoMapper;
using Entities.Concrete;
using Entities.DTOs.TaskListDtos;

namespace Business.Mapping.AutoMapper
{
	public class TaskListMapping : Profile
	{
		public TaskListMapping()
		{
			CreateMap<TaskList, AddTaskListDto>().ReverseMap();
		}
	}
}
