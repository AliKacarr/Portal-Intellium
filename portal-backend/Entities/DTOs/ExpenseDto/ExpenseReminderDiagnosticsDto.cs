namespace Entities.DTOs.ExpenseDto
{
    /// <summary>GET /api/expense/reminders/diagnostics — neden bildirim gelmediğini hızlı görmek için.</summary>
    public class ExpenseReminderDiagnosticsDto
    {
        public string EffectiveDateTr { get; set; } = "";
        public bool IsMonday { get; set; }
        public bool IsLastCalendarDay { get; set; }
        public bool ForceWeeklyOnScheduledRun { get; set; }
        /// <summary>Zamanlanmış job bugün (TR) gerçekten hatırlatma işleyecek mi (Pazartesi veya ay sonu veya Force).</summary>
        public bool ScheduledJobWouldProcessToday { get; set; }
        public int PendingOrRevisionExpenseCount { get; set; }
        public IReadOnlyList<long> ResolvedAdminUserIds { get; set; } = Array.Empty<long>();
        public long? CurrentUserId { get; set; }
        public bool CurrentUserInResolvedAdminList { get; set; }
        public bool MailParametersCustomer1Ok { get; set; }
        public List<string> Hints { get; set; } = new();
    }
}
