namespace Entities.DTOs.LogDtos
{
	public class UserActivityFilterDto
	{
		public string? RequestUrl { get; set; }
		public DateTime? StartDate { get; set; }
		public DateTime? EndDate { get; set; }
		public int? StatusCode { get; set; }
		public int Page { get; set; }
		public int Limit { get; set; } 
	}
}
