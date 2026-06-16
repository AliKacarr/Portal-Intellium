using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Entities.Concrete
{
    public class Document
    {
        public int Id { get; set; }
        public long UserId { get; set; }
        public long CustomerId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string Position { get; set; }

        public DateTime? CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public DateTime? LastAccessed { get; set; }
        public string Action { get; set; }
        public string Color { get; set; }
        public string ShareWith { get; set; }
        public string Privacy { get; set; }
        public string Type { get; set; }
        public byte[] TipData { get; set; }
        public string Path { get; set; }
        public int Parent { get; set; }
        public bool IsActive { get; set; }

        [NotMapped]
        public string? UserName { get; set; }
    }
}
