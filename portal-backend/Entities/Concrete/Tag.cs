using System;

namespace Entities.Concrete
{
    public class Tag
    {
        public Guid Id { get; set; }
        public long UserId { get; set; }
        public string Title { get; set; }
        public string ColorCode { get; set; }
        public bool IsDeleted { get; set; }
    }
}
