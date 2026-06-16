namespace Entities.DTOs.UserDtos
{
    public class ViewerDto
    {
        public long UserId { get; set; }
        public string UserName { get; set; }
        public DateTime ViewedAt { get; set; }
    }
}
