using Business.Repository.CvUserImportRepository;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Business.Workers
{
    public class CvUserImportWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly TimeSpan _idleDelay;
        private readonly TimeSpan _activeDelay;

        public CvUserImportWorker(IServiceProvider serviceProvider, IConfiguration configuration)
        {
            _serviceProvider = serviceProvider;
            _idleDelay = TimeSpan.FromSeconds(ReadInt(configuration, "CvUserImportWorker:IdleDelaySeconds", 15));
            _activeDelay = TimeSpan.FromMilliseconds(ReadInt(configuration, "CvUserImportWorker:ActiveDelayMilliseconds", 250));
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                var processedItem = false;

                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var service = scope.ServiceProvider.GetRequiredService<ICvUserImportService>();
                    var result = await service.ProcessNextPendingAsync(stoppingToken);
                    processedItem = result.Success && result.Data;
                }
                catch
                {
                    processedItem = false;
                }

                try
                {
                    await Task.Delay(processedItem ? _activeDelay : _idleDelay, stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    // Uygulama kapanırken normal: host'u düşürmesin, sessizce çık.
                    break;
                }
            }
        }

        private static int ReadInt(IConfiguration configuration, string key, int defaultValue)
        {
            return int.TryParse(configuration[key], out var value) && value > 0
                ? value
                : defaultValue;
        }
    }
}
