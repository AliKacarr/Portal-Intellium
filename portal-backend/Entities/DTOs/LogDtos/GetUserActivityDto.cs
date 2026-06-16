namespace Entities.DTOs.LogDtos
{
	public class GetUserActivityDto
	{
		public long Id { get; set; }
		public long SessionId { get; set; }
		public DateTime Time { get; set; }
		public int StatusCode { get; set; }
		public string RequestUrl { get; set; }
		public string Payload { get; set; }
		public string Response { get; set; }
	}
}
