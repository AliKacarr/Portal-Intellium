namespace Entities.DTOs.LogDtos
{
	public class SessionDto
	{
		public long Id { get; set; }
		public long UserId { get; set; }
		public string Username { get; set; }
		public string Token { get; set; }
		public string IPAddress { get; set; }
		public string UserAgent { get; set; }
		public bool Verified { get; set; }
	}
}
