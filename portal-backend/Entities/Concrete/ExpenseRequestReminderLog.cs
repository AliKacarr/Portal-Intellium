using System;

namespace Entities.Concrete
{
    public class ExpenseRequestReminderLog
    {
        public long Id { get; set; }
        public string RequestId { get; set; } = "";
        /// <summary>Weekly | MonthEnd (takvim ayının son günü; eski: PeriodEndMinus1)</summary>
        public string ReminderType { get; set; } = "";
        /// <summary>Job'un bu hatırlatmayı planladığı gün (TR yerel tarihe göre).</summary>
        public DateTime ScheduledForDate { get; set; }
        public DateTime? SentAt { get; set; }
        /// <summary>Sent | Failed</summary>
        public string Status { get; set; } = "Sent";
        public string? Error { get; set; }
    }
}

