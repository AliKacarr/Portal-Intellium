using System;

namespace Entities.Concrete
{
    public class NoteShare
    {
        public Guid Id { get; set; }
        public Guid NoteId { get; set; }
        public long UserId { get; set; }
        public bool IsReadOnly { get; set; }
        public DateTime SharedAt { get; set; }

        // Navigation properties (if needed, but usually we keep it simple in this architecture)
    }
}
