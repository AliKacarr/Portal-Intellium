using Quartz;

namespace Business.Schedulers.Keys
{
	public class JobKeys
	{
		public static readonly JobKey BirthdayJob = new("BirthdayJob");
		public static readonly JobKey InsuranceJob = new("InsuranceJob");
		public static readonly JobKey MilitaryJob = new("MilitaryJob");
		public static readonly JobKey ProjectTimeJob = new("ProjectTimeJob");
		public static readonly JobKey LeaveBalanceRefreshJob = new("LeaveBalanceRefreshJob");
		public static readonly JobKey ExpenseRequestReminderJob = new("ExpenseRequestReminderJob");
		public static readonly JobKey ExpenseIncompleteDraftCleanupJob = new("ExpenseIncompleteDraftCleanupJob");
	}
}
