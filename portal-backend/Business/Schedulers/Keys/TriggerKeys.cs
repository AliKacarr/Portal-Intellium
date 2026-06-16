using Quartz;

namespace Business.Schedulers.Keys
{
	public class TriggerKeys
	{
		public static readonly TriggerKey BirthdayTrigger = new("BirthdayTrigger");
		public static readonly TriggerKey InsuranceTrigger = new("InsuranceTrigger");
		public static readonly TriggerKey MilitaryTrigger = new("MilitaryTrigger");
		public static readonly TriggerKey ProjectTimeTrigger = new("ProjectTimeTrigger");
		public static readonly TriggerKey LeaveBalanceRefreshTrigger = new("LeaveBalanceRefreshTrigger");

		/// <summary>Eski tek tetikleyici adı; geriye dönük uyumluluk için bırakıldı.</summary>
		public static readonly TriggerKey ExpenseRequestReminderTrigger = new("ExpenseRequestReminderTrigger");

		public static readonly TriggerKey ExpenseRequestReminderMondayTrigger = new("ExpenseRequestReminderMondayTrigger");
		public static readonly TriggerKey ExpenseRequestReminderLastDayTrigger = new("ExpenseRequestReminderLastDayTrigger");
		public static readonly TriggerKey ExpenseIncompleteDraftCleanupDailyTrigger = new("ExpenseIncompleteDraftCleanupDailyTrigger");
	}
}
