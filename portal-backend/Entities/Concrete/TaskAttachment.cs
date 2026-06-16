namespace Entities.Concrete
{
    public class TaskAttachment
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public long CreatorUserId { get; set; }
        public string Name { get; set; }
        public string AttachmentPath { get; set; }
    }
}
