using System;

namespace Entities.Concrete
{
    public class NoteTag
    {
        public Guid Id { get; set; }
        public Guid NoteId { get; set; }
        public Guid TagId { get; set; }
    }
}
