namespace Entities.DTOs
{
    public class UserForCustomerRegisterDto
    {
        public string Name { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public long CustomerId { get; set; }
    }
}
