namespace Entities.Concrete.Logs
{
	public class Session
	{
		public long Id { get; set; }
		public long UserId { get; set; }
		public string Username { get; set; }
		public string Token { get; set; }
		public string IPAddress { get; set; }
		public string UserAgent { get; set; }
		public string? SessionHash { get; set; }
		public bool Verified { get; set; }
	}
}
