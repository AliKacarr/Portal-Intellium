using AutoMapper;
using Entities.Concrete;
using Entities.DTOs.TaskTodoDtos;

namespace Business.Mapping.AutoMapper
{
	public class TaskTodoMapping : Profile
	{
		public TaskTodoMapping()
		{
			CreateMap<AddTaskTodoDto, TaskTodo>();
		}
	}
}
