using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Entities.Concrete
{
    public class UserCustomer //ilişki tablosu
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public virtual User? User { get; set; }
        public long CustomerId { get; set; }
        public virtual Customer? Customer { get; set; }
        public DateTime AddetAt { get; set; }
        public bool IsActive { get; set; }
    }
}
