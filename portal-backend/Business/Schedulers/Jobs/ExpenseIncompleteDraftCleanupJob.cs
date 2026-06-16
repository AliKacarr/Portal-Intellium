using DataAccess.Concrete.EntityFramework.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Quartz;
using Task = System.Threading.Tasks.Task;

namespace Business.Schedulers.Jobs
{
    /// <summary>PeriodEndAt geçmiş "tamamlanmamış masraf" kayıtlarını hard delete eder.</summary>
    public sealed class ExpenseIncompleteDraftCleanupJob : IJob
    {
        private readonly PortalContext _context;
        private readonly ILogger<ExpenseIncompleteDraftCleanupJob> _logger;

        public ExpenseIncompleteDraftCleanupJob(PortalContext context, ILogger<ExpenseIncompleteDraftCleanupJob> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task Execute(IJobExecutionContext context)
        {
            var now = DateTime.UtcNow;
            try
            {
                var deleted = await _context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM expense_incomplete_drafts WHERE period_end_at IS NOT NULL AND period_end_at < {0};",
                    new object[] { now },
                    context.CancellationToken);

                _logger.LogInformation("IncompleteDraft cleanup tamam: Deleted={Deleted}, NowUtc={NowUtc}", deleted, now);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "IncompleteDraft cleanup başarısız. NowUtc={NowUtc}", now);
            }
        }
    }
}

