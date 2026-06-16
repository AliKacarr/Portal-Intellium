namespace Entities.DTOs.LogDtos
{
	public class ErrorFilterDto
	{
		public string? Type { get; set; }
		public int Page { get; set; }
		public int Limit { get; set; }
	}
}
