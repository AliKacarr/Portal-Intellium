using Entities.Concrete;

namespace Entities.DTOs
{
    public class UserCustomerDto : User
    {
        public long CustomerId { get; set; }
    }
}
