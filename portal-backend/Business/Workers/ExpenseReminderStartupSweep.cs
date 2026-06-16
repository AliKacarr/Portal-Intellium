using Business.Helpers;
using DataAccess.Concrete.EntityFramework.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Business.Workers
{
    /// <summary>
    /// API ayağa kalkınca bekleyen masraf talepleri için bir kez hatırlatma tetikler (idempotent Immediate log ile aynı gün tekrar etmez).
    /// </summary>
    public sealed class ExpenseReminderStartupSweep : IHostedService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IConfiguration _configuration;
        private readonly ILogger<ExpenseReminderStartupSweep> _logger;

        public ExpenseReminderStartupSweep(
            IServiceScopeFactory scopeFactory,
            IConfiguration configuration,
            ILogger<ExpenseReminderStartupSweep> logger)
        {
            _scopeFactory = scopeFactory;
            _configuration = configuration;
            _logger = logger;
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            // Üretim kuralı: API her açıldığında tetikleme yapma. Sadece açıkça true verilirse çalışır.
            if (!_configuration.GetValue("ExpenseReminder:SweepPendingOnStartup", false))
                return Task.CompletedTask;

            _ = Task.Run(async () =>
            {
                try
                {
                    await Task.Delay(TimeSpan.FromSeconds(2), cancellationToken).ConfigureAwait(false);
                    using var scope = _scopeFactory.CreateScope();
                    var ctx = scope.ServiceProvider.GetRequiredService<PortalContext>();
                    var runner = scope.ServiceProvider.GetRequiredService<IExpenseReminderRunner>();

                    var requestIds = await ctx.Expenses.AsNoTracking()
                        .Where(e => e.IsActive
                                    && !string.IsNullOrWhiteSpace(e.RequestId)
                                    && (e.Status == "Beklemede" || e.Status == "Revize Edildi"))
                        .Select(e => e.RequestId)
                        .Distinct()
                        .ToListAsync(cancellationToken)
                        .ConfigureAwait(false);

                    var resendImmediate = _configuration.GetValue("ExpenseReminder:ResendImmediateOnStartup", true);

                    foreach (var rid in requestIds)
                    {
                        // Her talep için ayrı scope: DbContext aynı anda kullanılmasın (hosted service + diğer işlemler çakışabiliyor).
                        using var perRequestScope = _scopeFactory.CreateScope();
                        var perRequestRunner = perRequestScope.ServiceProvider.GetRequiredService<IExpenseReminderRunner>();
                        await perRequestRunner.NotifyAdminsForExpenseRequestAsync(rid, cancellationToken, resendImmediate).ConfigureAwait(false);
                    }

                    _logger.LogInformation(
                        "Masraf başlangıç taraması tamam: {Count} talep (ResendImmediateOnStartup={Resend}).",
                        requestIds.Count,
                        resendImmediate);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Masraf başlangıç taraması başarısız.");
                }
            }, cancellationToken);

            return Task.CompletedTask;
        }

        public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    }
}
