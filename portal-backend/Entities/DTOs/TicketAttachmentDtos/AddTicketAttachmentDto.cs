using Microsoft.AspNetCore.Http;

namespace Entities.DTOs.TicketAttachmentDtos
{
    public class AddTicketAttachmentDto
    {
        public List<IFormFile> TicketAttachments { get; set; }
        public long TicketId { get; set; }
    }
}
