namespace Entities.DTOs.LogDtos
{
	public class ErrorDto
	{
		public long Id { get; set; }
		public string Type { get; set; }
		public string Message { get; set; }
		public long StackTraceId { get; set; }
		public long ActivityId { get; set; }
	}
}
