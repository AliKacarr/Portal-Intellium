namespace Business.MessageBrokers.MassTransit.RabbitMQ.Publishers
{
    public interface IPublisher<T>
    {
        Task Publish(T message);
    }
}
