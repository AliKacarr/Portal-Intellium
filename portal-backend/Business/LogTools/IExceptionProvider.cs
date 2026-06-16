namespace Business.LogTools
{
	public interface IExceptionProvider
	{
		int GetStatusCode(Exception exception);
		void SaveError(Exception exception, long ActivityId);
	}
}
