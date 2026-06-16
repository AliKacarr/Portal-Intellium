using Entities.DTOs.TaskDtos;

namespace Entities.DTOs.TaskListDtos
{
	public class TaskListDto
	{
		public int Id { get; set; }
		public int BoardId { get; set; }
		public string Name { get; set; }
		public int OrderNo { get; set; }
		public List<TaskForTaskListDto> Tasks { get; set; }
	}
}
