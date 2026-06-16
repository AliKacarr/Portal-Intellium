namespace Entities.DTOs.TaskDtos
{
	public class AddTaskDto
	{
		public Concrete.Task Task { get; set; }
		public List<int>? AddUserIds { get; set; }
		public List<int>? AddLabelIds { get; set; }

	}
}
