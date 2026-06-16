using MassTransit;
using Microsoft.Extensions.DependencyInjection;

namespace Business.MessageBrokers.MassTransit.RabbitMQ.Extensions
{
    public static class AddMassTransitRabbitMQExtensions
    {
        /// <summary>RabbitMQ connection string doluysa RabbitMQ kullanır; boş/null ise InMemory (uygulama yine başlar, mesajlar bellekte).</summary>
        public static void AddRabbitMQService(this IServiceCollection services, string? rabbitMQConnectionString)
        {
            services.AddMassTransit(configurator =>
            {
                if (!string.IsNullOrWhiteSpace(rabbitMQConnectionString))
                {
                    configurator.UsingRabbitMq((context, config) =>
                    {
                        config.Host(rabbitMQConnectionString);
                    });
                }
                else
                {
                    configurator.UsingInMemory((context, config) => { });
                }
            });
        }
    }
}
