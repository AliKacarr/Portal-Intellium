using Business.Helpers;
using Entities.DTOs.ExpenseDto;
using Microsoft.Extensions.Logging;
using Quartz;
using Task = System.Threading.Tasks.Task;

namespace Business.Schedulers.Jobs
{
    public class ExpenseRequestReminderJob : IJob
    {
        private readonly IExpenseReminderRunner _runner;
        private readonly ILogger<ExpenseRequestReminderJob> _logger;

        public ExpenseRequestReminderJob(IExpenseReminderRunner runner, ILogger<ExpenseRequestReminderJob> logger)
        {
            _runner = runner;
            _logger = logger;
        }

        public async Task Execute(IJobExecutionContext context)
        {
            var result = await _runner.RunScheduledAsync(new RunExpenseRemindersDto { DryRun = false }, context.CancellationToken);
            if (!result.Success)
            {
                _logger.LogWarning("Masraf hatırlatma job hata: {Message}", result.Message);
                return;
            }

            var d = result.Data;
            if (d == null)
            {
                _logger.LogWarning("Masraf hatırlatma job: sonuç verisi yok.");
                return;
            }

            _logger.LogInformation(
                "Masraf hatırlatma job tamam. Tarih={Date}, Weekly={W}, MonthEnd={M}, SkippedSchedule={Skip}, SkippedIdempotent={Idem}, Pending+Revize COUNT ile başlayan satırlar: {Details}",
                d.EffectiveDateTr,
                d.WeeklyProcessed,
                d.MonthEndProcessed,
                d.SkippedDueToSchedule,
                d.SkippedAlreadySent,
                d.Details.Count > 0 ? string.Join(" | ", d.Details) : "(yok)");

            if (d.WeeklyProcessed == 0 && d.MonthEndProcessed == 0 && d.Details.Any(x => x.Contains("hatırlatma günü değil", StringComparison.OrdinalIgnoreCase)))
                _logger.LogDebug("Masraf hatırlatma: bugün (TR) iş günü tetiklemesi yok; sonraki çalışmada tekrar denenecek.");
        }
    }
}
