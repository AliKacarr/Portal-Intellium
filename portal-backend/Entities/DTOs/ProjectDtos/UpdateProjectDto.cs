namespace Entities.DTOs.ProjectDtos
{
	public class UpdateProjectDto
	{
		public long Id { get; set; }
		public string ProjectName { get; set; }
		public string Description { get; set; }
		public long ProjectTypeId { get; set; }
		public long LeaderUserId { get; set; }
		public long CustomerId { get; set; }
		public DateTime StartDate { get; set; }
		public DateTime FinishDate { get; set; }
		public bool IsActive { get; set; }
	}
}
