using AutoMapper;
using Entities.Concrete;
using Entities.DTOs.TaskTodoListDtos;

namespace Business.Mapping.AutoMapper
{
	public class TaskTodoListMapping : Profile
	{
		public TaskTodoListMapping()
		{
			CreateMap<AddTaskTodoListDto, TaskTodoList>().ReverseMap();
		}
	}
}
