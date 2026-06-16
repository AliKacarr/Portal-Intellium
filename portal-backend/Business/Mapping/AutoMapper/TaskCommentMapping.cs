using AutoMapper;
using Entities.Concrete;
using Entities.DTOs.TaskCommentDtos;

namespace Business.Mapping.AutoMapper
{
	public class TaskCommentMapping : Profile
	{
		public TaskCommentMapping()
		{
			CreateMap<TaskComment, AddTaskCommentDto>().ReverseMap();
		}
	}
}
