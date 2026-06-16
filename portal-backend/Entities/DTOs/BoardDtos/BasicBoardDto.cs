using Entities.Concrete;

namespace Entities.DTOs.BoardDtos
{
	public class BasicBoardDto
	{
		public int Id { get; set; }
		public BoardCategory Category { get; set; }
		public long CreatedUserId { get; set; }
		public string Name { get; set; }
		public string AvatarPath { get; set; }
	}
}
