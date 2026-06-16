using Entities.Concrete;
using Entities.DTOs.AuthDtos;

namespace Entities.DTOs
{
    public class UserAndCustomerRegisterDto
    {
        public UserForRegisterDto UserForRegisterDto { get; set; }
        public Customer? Customer { get; set; }
    }
}
