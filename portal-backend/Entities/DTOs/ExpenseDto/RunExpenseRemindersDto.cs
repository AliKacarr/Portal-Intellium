namespace Entities.DTOs.ExpenseDto
{
    /// <summary>Manuel test: POST /api/expense/reminders/run</summary>
    public class RunExpenseRemindersDto
    {
        /// <summary>ISO 8601 (örn. 2026-04-06T09:00:00+03:00). Boşsa gerçek zaman (TR).</summary>
        public string? SimulateNow { get; set; }

        /// <summary>true: mail/bildirim/log yazılmaz, sadece özet döner.</summary>
        public bool DryRun { get; set; }

        /// <summary>Opsiyonel YYYY-MM: sadece bu döneme ait talepler (dönem sonu testi için).</summary>
        public string? Period { get; set; }

        /// <summary>
        /// Sadece manuel <c>POST /api/expense/reminders/run</c> (admin) için: Pazartesi / dönem sonu-1
        /// koşulunu yok sayıp Weekly hatırlatmayı tetikler. Quartz job bu bayrağı yok sayar.
        /// </summary>
        public bool IgnoreScheduleRules { get; set; }

        /// <summary>
        /// Sadece manuel çağrı: aynı gün için idempotent (ExpenseRequestReminderLogs) kontrolünü atla ve yeniden gönder.
        /// Quartz bu bayrağı yok sayar.
        /// </summary>
        public bool ForceResend { get; set; }
    }
}
