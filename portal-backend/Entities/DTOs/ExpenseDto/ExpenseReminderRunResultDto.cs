namespace Entities.DTOs.ExpenseDto
{
    public class ExpenseReminderRunResultDto
    {
        public string EffectiveDateTr { get; set; } = "";
        public bool DryRun { get; set; }
        public string? PeriodFilter { get; set; }
        public int WeeklyProcessed { get; set; }
        /// <summary>Ayın takvim son günü (Europe/Istanbul) tetiklemesi.</summary>
        public int MonthEndProcessed { get; set; }
        public int SkippedAlreadySent { get; set; }
        public int SkippedFiltered { get; set; }
        /// <summary>İncelenen talep grubu sayısı (RequestId bazında).</summary>
        public int CandidateRequestGroups { get; set; }
        /// <summary>Pazartesi / dönem sonu-1 tetiklenmediği için atlanan talep grubu.</summary>
        public int SkippedDueToSchedule { get; set; }
        /// <summary>Dönem çözülemediği için atlanan talep grubu.</summary>
        public int SkippedUnresolvedPeriod { get; set; }
        /// <summary>Admin başına mail gönderiminde yakalanan hata sayısı (SMTP vb.).</summary>
        public int MailSendFailures { get; set; }
        /// <summary>Bildirim kaydı eklenemedi (kullanıcı yok vb.).</summary>
        public int NotificationAddFailures { get; set; }
        public List<string> Details { get; set; } = new();
    }
}
