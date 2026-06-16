using Business.Repository.HolidayRepository;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Business.Workers
{
    public class HolidayWorker : IHostedService
    {
        // ServiceProvider kullanıyoruz çünkü IHolidayService "Scoped" bir servis, 
        // ama Worker "Singleton" çalışır. Scope oluşturmamız lazım.
        private readonly IServiceProvider _serviceProvider;

        public HolidayWorker(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            // Uygulama başladığında 1 kere çalışır
            using (var scope = _serviceProvider.CreateScope())
            {
                var holidayService = scope.ServiceProvider.GetRequiredService<IHolidayService>();
                
                int currentYear = DateTime.Now.Year;
                
                // Hem bu yıl hem de gelecek yıl için kontrol et ve ekle
                // (Senin isteğin üzerine +1 yıl)
                holidayService.GenerateHolidaysForYear(currentYear);
                holidayService.GenerateHolidaysForYear(currentYear + 1);
            }
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            return Task.CompletedTask;
        }
    }
}