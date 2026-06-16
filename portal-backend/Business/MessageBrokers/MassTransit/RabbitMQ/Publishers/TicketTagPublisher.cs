using Business.MessageBrokers.MassTransit.RabbitMQ.Queues;
using Entities.DTOs.TicketDtos;
using MassTransit;

namespace Business.MessageBrokers.MassTransit.RabbitMQ.Publishers
{
    public class TicketTagPublisher : IPublisher<PublishTicketDto>
    {
        private readonly ISendEndpointProvider _sendEndpointProvider;

        public TicketTagPublisher(ISendEndpointProvider sendEndpointProvider)
        {
            _sendEndpointProvider = sendEndpointProvider;
        }

        public async Task Publish(PublishTicketDto message)
        {
            ISendEndpoint sendEndpoint = await _sendEndpointProvider.GetSendEndpoint(new Uri($"queue:{RabbitMQQueues.TicketTagQueue}"));
            await sendEndpoint.Send(message);
        }
    }
}
