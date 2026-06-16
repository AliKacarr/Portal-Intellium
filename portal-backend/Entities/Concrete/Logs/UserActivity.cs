namespace Entities.Concrete.Logs
{
	public class UserActivity
	{
		public long Id { get; set; }
		public long SessionId { get; set; }
		public long RequestUrlId { get; set; }
		public string Payload { get; set; }
		public int StatusCode { get; set; }
		public DateTime Time { get; set; }
		public string Response { get; set; }
	}
}
