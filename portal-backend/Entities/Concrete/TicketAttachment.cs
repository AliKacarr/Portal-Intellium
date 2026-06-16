namespace Entities.Concrete
{
    public class TicketAttachment
    {
        public long Id { get; set; }
        public long TicketId { get; set; }
        public long CreatorUserId { get; set; }
        public string Name { get; set; }
        public string AttachmentPath { get; set; }
    }
}
