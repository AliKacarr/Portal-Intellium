namespace Entities.Concrete
{
    public class RequestAttachment
    {
        public long Id { get; set; }
        public long RequestId { get; set; }
        public long CreatorUserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string AttachmentPath { get; set; } = string.Empty;
        public string? ContentType { get; set; }
        public long SizeBytes { get; set; }
    }
}

