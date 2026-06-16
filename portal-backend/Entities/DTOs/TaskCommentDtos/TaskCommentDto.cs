using Entities.DTOs.UserDtos;

namespace Entities.DTOs.TaskCommentDtos
{
	public class TaskCommentDto
	{
		public int Id { get; set; }
		public BaseUserDto User { get; set; }
		public string Content { get; set; }
		public DateTime CreatedDate { get; set; }
	}
}
