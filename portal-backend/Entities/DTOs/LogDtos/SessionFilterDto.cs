namespace Entities.DTOs.LogDtos
{
	public class SessionFilterDto
	{
		public string? Username { get; set; }
		public bool? Verified { get; set; }
		public int Page { get; set; }
		public int Limit { get; set; }
	}
}
