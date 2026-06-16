namespace Entities.Concrete.Logs
{
	public class Error
	{
		public long Id { get; set; }
		public long ActivityId { get; set; }
		public long TypeId { get; set; }
		public long MessageId { get; set; }
		public long StackTraceId { get; set; }
	}
}
