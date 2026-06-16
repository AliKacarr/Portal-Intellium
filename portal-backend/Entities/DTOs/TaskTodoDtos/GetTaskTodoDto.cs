using Entities.DTOs.UserDtos;

namespace Entities.DTOs.TaskTodoDtos
{
	public class GetTaskTodoDto
	{
		public int Id { get; set; }
		public int TaskTodoListId { get; set; }
		public string Content { get; set; }
		public bool State { get; set; } = false;
		public DateTime CreatedDate { get; set; }
		public DateTime? DueDate { get; set; }
		public DateTime? CompletedDate { get; set; }
		public BaseUserDto? CompletedByUser { get; set; }
	}
}
