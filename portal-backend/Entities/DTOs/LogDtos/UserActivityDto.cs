using Entities.Concrete.Logs;

namespace Entities.DTOs.LogDtos
{
	public class UserActivityDto
	{
		public long Id { get; set; }
		public string RequestUrl { get; set; }
		public string Payload { get; set; }
		public DateTime Time { get; set; }
		public int StatusCode { get; set; }
		public string Response { get; set; }
		public Session Session { get; set; }
	}
}
